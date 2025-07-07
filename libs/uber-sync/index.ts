import { prisma } from '../database'
import { getUberAPI } from '../uber-api'
import { calculateDriverScore } from '../driver-scoring'
import { DriverStatus } from '@prisma/client'

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

      // Sync driver metrics and calculate score
      await this.syncDriverMetrics(localDriver.id, uberDriver.driver_id || uberDriver.driverId)
    } catch (error) {
      const errorMsg = `[SYNC] Error in processDriver for Uber ID ${uberDriver.driver_id || uberDriver.driverId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      console.error(errorMsg, error)
      result.errors.push(errorMsg)
      throw error
    }
  }

  // Sync driver performance metrics
  private async syncDriverMetrics(localDriverId: string, driverUuid: string): Promise<void> {
    try {
      const uberAPI = getUberAPI()
      // Get metrics for the last 7 days
      const endDate = new Date()
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      // Get trips from Uber using the new method
      const trips = await uberAPI.getTripsForDriver(driverUuid, startDate, endDate)
      // Calculate performance data using the new method
      const performanceData = uberAPI.calculateDriverMetricsFromTrips(driverUuid, trips)
      // Calculate final score using our scoring engine
      const calculatedScore = calculateDriverScore(performanceData)
      // Store metrics in database
      await prisma.driverMetrics.upsert({
        where: {
          driverId_date: {
            driverId: localDriverId,
            date: new Date(endDate.toISOString().split('T')[0])
          }
        },
        update: {
          acceptanceRate: performanceData.acceptanceRate,
          cancellationRate: performanceData.cancellationRate,
          completionRate: performanceData.completionRate,
          feedbackScore: performanceData.feedbackScore,
          tripVolumeIndex: performanceData.tripVolumeIndex,
          idleRatio: performanceData.idleRatio,
          calculatedScore: calculatedScore,
        },
        create: {
          driverId: localDriverId,
          date: new Date(endDate.toISOString().split('T')[0]),
          acceptanceRate: performanceData.acceptanceRate,
          cancellationRate: performanceData.cancellationRate,
          completionRate: performanceData.completionRate,
          feedbackScore: performanceData.feedbackScore,
          tripVolumeIndex: performanceData.tripVolumeIndex,
          idleRatio: performanceData.idleRatio,
          calculatedScore: calculatedScore,
        }
      })

    } catch (error) {
      console.error(`Error syncing metrics for driver ${driverUuid}:`, error)
      // Continue with other drivers even if one fails
    }
  }

  // Map Uber driver status to local status enum
  private mapUberStatusToLocal(uberStatus: string): DriverStatus {
    if (!uberStatus) return DriverStatus.INACTIVE
    switch (uberStatus.toUpperCase()) {
      case 'ACTIVE': return DriverStatus.ACTIVE
      case 'INACTIVE': return DriverStatus.INACTIVE
      case 'SUSPENDED': return DriverStatus.SUSPENDED
      case 'DRIVER_STATUS_ONLINE': return DriverStatus.ACTIVE
      case 'DRIVER_STATUS_OFFLINE': return DriverStatus.INACTIVE
      // Add more mappings as Uber adds new statuses
      default: return DriverStatus.INACTIVE
    }
  }

  // Sync specific driver by Uber ID
  async syncSpecificDriver(uberDriverId: string): Promise<void> {
    try {
      const uberAPI = getUberAPI()
      const orgId = process.env.UBER_ORG_ID
      if (!orgId) throw new Error('UBER_ORG_ID must be set in environment variables.')
      const data = await uberAPI.listDrivers(orgId)
      const uberDriver = data.find((d: any) => d.driver_id === uberDriverId)
      if (!uberDriver) {
        throw new Error(`Driver ${uberDriverId} not found in Uber Fleet API`)
      }
      const result: SyncResult = {
        success: false,
        driversProcessed: 0,
        driversUpdated: 0,
        driversCreated: 0,
        errors: []
      }
      await this.processDriver(uberDriver, result)
    } catch (error) {
      console.error(`Error syncing specific driver ${uberDriverId}:`, error)
      throw error
    }
  }

  // Get sync status/summary
  async getSyncSummary(): Promise<{
    lastSyncTime: Date | null
    totalDrivers: number
    activeDrivers: number
    driversWithMetrics: number
  }> {
    const [totalDrivers, activeDrivers, driversWithMetrics, lastMetric] = await Promise.all([
      prisma.driver.count(),
      prisma.driver.count({ where: { status: DriverStatus.ACTIVE } }),
      prisma.driver.count({
        where: {
          metrics: {
            some: {}
          }
        }
      }),
      prisma.driverMetrics.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true }
      })
    ])

    return {
      lastSyncTime: lastMetric?.createdAt || null,
      totalDrivers,
      activeDrivers,
      driversWithMetrics,
    }
  }

  // Fetch the latest sync log
  async getLatestSyncLog() {
    return prisma.uberSyncLog.findFirst({
      orderBy: { startedAt: 'desc' }
    })
  }
}

export const uberSyncService = new UberSyncService() 