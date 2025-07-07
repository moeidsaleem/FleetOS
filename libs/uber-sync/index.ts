import { prisma } from '../database'
import { getUberAPI } from '../uber-api'
import { calculateDriverScore } from '../driver-scoring'
import { DriverStatus } from '@prisma/client'
import { scoreDriverFromAnalytics, defaultAnalyticsScoreConfig, AnalyticsMetrics, AnalyticsScoreConfig } from '../driver-scoring/analytics-score'
import { Prisma } from '@prisma/client'

export interface SyncResult {
  success: boolean
  driversProcessed: number
  driversUpdated: number
  driversCreated: number
  errors: string[]
}

export class UberSyncService {
  
  // Main sync function to pull data from Uber and update local database
  async syncDriversFromUber(syncType: 'AUTO' | 'MANUAL' = 'MANUAL', createdBy: string | null = null): Promise<SyncResult> {
    const syncLog = await prisma.uberSyncLog.create({
      data: {
        startedAt: new Date(),
        status: 'IN_PROGRESS',
        type: syncType,
        createdBy: createdBy || 'system',
      }
    })
    const result: SyncResult = {
      success: false,
      driversProcessed: 0,
      driversUpdated: 0,
      driversCreated: 0,
      errors: []
    }
    let finishedAt = new Date()
    let status = 'SUCCESS'
    let errorMessage = null
    try {
      console.log('Starting Uber Fleet API sync (OAuth)...')
      const uberAPI = getUberAPI()
      const orgId = process.env.UBER_ORG_ID
      if (!orgId) {
        const errorMsg = 'UBER_ORG_ID must be set in environment variables.'
        console.error(errorMsg)
        result.errors.push(errorMsg)
        status = 'FAILURE'
        errorMessage = errorMsg
        return result
      }
      // Get all drivers from Uber Fleet API (status overviews)
      const statusOverviews = await uberAPI.getDriverStatusOverviews(orgId)
      console.log(`[SYNC] Fetched ${statusOverviews.length} driver status overviews from Uber API`)
      
      // Process each driver status overview
      for (const [i, overview] of statusOverviews.entries()) {
        try {
          const driverInfo = overview.driverInfo || {}
          const statusEntries = overview.statusEntries || []
          const latestStatus = statusEntries.length > 0 ? statusEntries[0].status : null
          const onboardingStatus = overview.onboardingStatus
          const vehicleInfo = overview.vehicleInfo || {}
          console.log(`[SYNC] Processing driver #${i + 1}:`, JSON.stringify(overview, null, 2))
          // Compose a pseudo-Uber driver object for processDriver
          const pseudoUberDriver = {
            driver_id: driverInfo.driverUuid,
            firstName: driverInfo.firstName,
            lastName: driverInfo.lastName,
            email: driverInfo.email,
            phoneNumber: driverInfo.phone,
            status: latestStatus,
            onboardingStatus,
            vehicleInfo,
            // Add more fields as needed
          }
          await this.processDriver(pseudoUberDriver, result)
          result.driversProcessed++
        } catch (error) {
          const errorMsg = `Error processing driverStatusOverview: ${error instanceof Error ? error.message : 'Unknown error'}`
          console.error(errorMsg, error)
          result.errors.push(errorMsg)
        }
      }
      
      // After processing all drivers, fetch analytics and update metrics
      try {
        const drivers = await prisma.driver.findMany({ where: { uberDriverId: { not: '' } } })
        const driverUuids = drivers.map(d => d.uberDriverId)
        const uberAPI = getUberAPI()
        const now = Date.now()
        const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000
        const batchSize = 50
        // Load config from SystemConfig if available
        let analyticsScoreConfig: AnalyticsScoreConfig = defaultAnalyticsScoreConfig
        try {
          const configRow = await prisma.systemConfig.findUnique({ where: { key: 'analyticsScoreConfig' } })
          if (configRow && configRow.value) {
            analyticsScoreConfig = configRow.value as unknown as AnalyticsScoreConfig
          }
        } catch {}
        for (let i = 0; i < driverUuids.length; i += batchSize) {
          const batch = driverUuids.slice(i, i + batchSize)
          const analyticsResponse = await uberAPI.fetchDriverAnalytics(batch, sevenDaysAgo, now)
          const rows = analyticsResponse.reports?.[0]?.data?.timeRangeData?.[0]?.rows || []
          for (const row of rows) {
            const driverId = row.dimensionId as string
            const [hoursOnline, hoursOnTrip, trips, earnings] = row.metricValues.map(parseFloat)
            const metrics: AnalyticsMetrics = { hoursOnline, hoursOnTrip, trips, earnings }
            const score = scoreDriverFromAnalytics(metrics, analyticsScoreConfig)
            // Find local driver by Uber UUID
            const localDriver = drivers.find(d => d.uberDriverId === driverId)
            if (!localDriver) continue
            // Upsert metrics for today
            await prisma.driverMetrics.upsert({
              where: {
                driverId_date: {
                  driverId: localDriver.id,
                  date: new Date(new Date(now).toISOString().split('T')[0])
                }
              },
              update: {
                analyticsMetrics: metrics as unknown as Prisma.JsonObject,
                calculatedScore: score / 100,
                acceptanceRate: 0,
                cancellationRate: 0,
                completionRate: 0,
                feedbackScore: 0,
                tripVolumeIndex: 0,
                idleRatio: 0
              },
              create: {
                driverId: localDriver.id,
                date: new Date(new Date(now).toISOString().split('T')[0]),
                acceptanceRate: 0,
                cancellationRate: 0,
                completionRate: 0,
                feedbackScore: 0,
                tripVolumeIndex: 0,
                idleRatio: 0,
                analyticsMetrics: metrics as unknown as Prisma.JsonObject,
                calculatedScore: score / 100
              }
            })
          }
        }
      } catch (err) {
        console.error('Analytics scoring failed:', err)
      }
      
      // Calculate success
      result.success = result.errors.length === 0 || result.driversProcessed > 0
      
      console.log(`[SYNC] Sync completed: ${result.driversProcessed} processed, ${result.driversCreated} created, ${result.driversUpdated} updated`)
      if (result.errors.length > 0) {
        console.error('[SYNC] Errors:', result.errors)
        status = 'PARTIAL'
        errorMessage = result.errors.join('; ')
      }
      finishedAt = new Date()
      return result
      
    } catch (error) {
      const errorMsg = `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      console.error('[SYNC] Fatal error:', errorMsg, error)
      result.errors.push(errorMsg)
      status = 'FAILURE'
      errorMessage = errorMsg
      finishedAt = new Date()
      return result
    } finally {
      await prisma.uberSyncLog.update({
        where: { id: syncLog.id },
        data: {
          finishedAt,
          status,
          driversProcessed: result.driversProcessed,
          driversCreated: result.driversCreated,
          driversUpdated: result.driversUpdated,
          errorMessage,
        }
      })
    }
  }

  // Process individual driver from Uber data
  private async processDriver(uberDriver: any, result: SyncResult): Promise<void> {
    try {
      // Check if driver exists in local database
      let localDriver = await prisma.driver.findFirst({
        where: { uberDriverId: uberDriver.driver_id || uberDriver.driverId }
      })
      console.log(`[SYNC] Local driver lookup for Uber ID ${uberDriver.driver_id || uberDriver.driverId}:`, localDriver)

      // Log Uber status
      console.log(`[SYNC] Uber status for driver ${uberDriver.driver_id || uberDriver.driverId}:`, uberDriver.status)

      // Map Uber status to our local status
      const mappedStatus = this.mapUberStatusToLocal(uberDriver.status)
      
      const driverData = {
        name: `${uberDriver.profile?.first_name || uberDriver.firstName || ''} ${uberDriver.profile?.last_name || uberDriver.lastName || ''}`.trim(),
        email: uberDriver.profile?.email || uberDriver.email || `${uberDriver.driver_id || uberDriver.driverId}@uber.example.com`,
        phone: (
          uberDriver.profile?.phone_number ||
          (typeof uberDriver.phoneNumber === 'object' && uberDriver.phoneNumber.countryCode && uberDriver.phoneNumber.number
            ? `${uberDriver.phoneNumber.countryCode}${uberDriver.phoneNumber.number}`
            : typeof uberDriver.phoneNumber === 'string'
              ? uberDriver.phoneNumber
              : '')
        ),
        uberDriverId: uberDriver.driver_id || uberDriver.driverId,
        status: localDriver ? mappedStatus : 'ACTIVE', // New drivers always ACTIVE, existing use mapped
        updatedAt: new Date(),
      }
      console.log(`[SYNC] Mapped driver data:`, driverData)

      if (localDriver) {
        // Update existing driver
        localDriver = await prisma.driver.update({
          where: { id: localDriver.id },
          data: driverData
        })
        result.driversUpdated++
        console.log(`[SYNC] Updated driver ${localDriver.id}`)
      } else {
        // Create new driver
        localDriver = await prisma.driver.create({
          data: {
            ...driverData,
            joinedAt: new Date(uberDriver.created_at || Date.now()),
          }
        })
        result.driversCreated++
        console.log(`[SYNC] Created new driver ${localDriver.id}`)
      }
    } catch (error) {
      const errorMsg = `[SYNC] Error in processDriver for Uber ID ${uberDriver.driver_id || uberDriver.driverId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      console.error(errorMsg, error)
      result.errors.push(errorMsg)
    }
  }

  private mapUberStatusToLocal(uberStatus: string | null): DriverStatus {
    // Implement the logic to map Uber status to local status
    // This is a placeholder and should be replaced with the actual implementation
    return 'ACTIVE' as DriverStatus
  }
}
