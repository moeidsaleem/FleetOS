import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/libs/database'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const table = searchParams.get('table')
    const limit = parseInt(searchParams.get('limit') || '100')

    // Get all available tables and their data
    const databaseData = await getDatabaseData(table, limit)

    return NextResponse.json({
      success: true,
      data: databaseData,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Database access error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to access database' },
      { status: 500 }
    )
  }
}

async function getDatabaseData(table?: string | null, limit: number = 100) {
  const data: any = {}

  try {
    // Get drivers with their metrics and alerts
    if (!table || table === 'drivers') {
      data.drivers = await prisma.driver.findMany({
        take: limit,
        include: {
          metrics: {
            orderBy: { date: 'desc' },
            take: 30 // Last 30 days of metrics
          },
          alerts: {
            orderBy: { createdAt: 'desc' },
            take: 10 // Last 10 alerts
          },
          driverDocuments: true,
          driverNotes: {
            orderBy: { createdAt: 'desc' },
            take: 5 // Last 5 notes
          }
        },
        orderBy: { joinedAt: 'desc' }
      })
    }

    // Get driver metrics
    if (!table || table === 'driver_metrics') {
      data.driverMetrics = await prisma.driverMetrics.findMany({
        take: limit,
        include: {
          driver: {
            select: {
              id: true,
              name: true,
              uberDriverId: true,
              status: true
            }
          }
        },
        orderBy: { date: 'desc' }
      })
    }

    // Get alert records
    if (!table || table === 'alert_records') {
      data.alertRecords = await prisma.alertRecord.findMany({
        take: limit,
        include: {
          driver: {
            select: {
              id: true,
              name: true,
              uberDriverId: true,
              status: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    }

    // Get alert rules
    if (!table || table === 'alert_rules') {
      data.alertRules = await prisma.alertRule.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' }
      })
    }

    // Get notification templates
    if (!table || table === 'notification_templates') {
      data.notificationTemplates = await prisma.notificationTemplate.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' }
      })
    }

    // Get system config
    if (!table || table === 'system_config') {
      data.systemConfig = await prisma.systemConfig.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' }
      })
    }

    // Get Uber sync logs
    if (!table || table === 'uber_sync_logs') {
      data.uberSyncLogs = await prisma.uberSyncLog.findMany({
        take: limit,
        orderBy: { startedAt: 'desc' }
      })
    }

    // Get users
    if (!table || table === 'users') {
      data.users = await prisma.user.findMany({
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          emailVerified: true
        },
        orderBy: { createdAt: 'desc' }
      })
    }

    // Get driver documents
    if (!table || table === 'driver_documents') {
      data.driverDocuments = await prisma.driverDocument.findMany({
        take: limit,
        include: {
          driver: {
            select: {
              id: true,
              name: true,
              uberDriverId: true
            }
          }
        },
        orderBy: { uploadedAt: 'desc' }
      })
    }

    // Get driver notes
    if (!table || table === 'driver_notes') {
      data.driverNotes = await prisma.driverNote.findMany({
        take: limit,
        include: {
          driver: {
            select: {
              id: true,
              name: true,
              uberDriverId: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    }

    // If no specific table requested, get summary statistics
    if (!table) {
      data.summary = await getSummaryStatistics()
    }

    return data
  } catch (error) {
    console.error('Error fetching database data:', error)
    throw error
  }
}

async function getSummaryStatistics() {
  try {
    const [
      totalDrivers,
      activeDrivers,
      totalAlerts,
      recentAlerts,
      totalMetrics,
      avgScore,
      recentSyncs
    ] = await Promise.all([
      prisma.driver.count(),
      prisma.driver.count({ where: { status: 'ACTIVE' } }),
      prisma.alertRecord.count(),
      prisma.alertRecord.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      }),
      prisma.driverMetrics.count(),
      prisma.driverMetrics.aggregate({
        _avg: { calculatedScore: true }
      }),
      prisma.uberSyncLog.findMany({
        take: 5,
        orderBy: { startedAt: 'desc' }
      })
    ])

    return {
      totalDrivers,
      activeDrivers,
      inactiveDrivers: totalDrivers - activeDrivers,
      totalAlerts,
      recentAlerts,
      totalMetrics,
      averageScore: avgScore._avg.calculatedScore || 0,
      recentSyncs: recentSyncs.map(sync => ({
        id: sync.id,
        status: sync.status,
        startedAt: sync.startedAt,
        finishedAt: sync.finishedAt,
        driversProcessed: sync.driversProcessed,
        driversCreated: sync.driversCreated,
        driversUpdated: sync.driversUpdated
      }))
    }
  } catch (error) {
    console.error('Error fetching summary statistics:', error)
    return {}
  }
}
