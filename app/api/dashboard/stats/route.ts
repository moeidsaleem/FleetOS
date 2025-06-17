import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../libs/database'
import { getUberAPI } from '../../../../libs/uber-api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '24h'
    
    // Calculate date range
    const now = new Date()
    let startDate: Date
    
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '24h':
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
    }

    // Get basic driver stats
    const [totalDrivers, activeDrivers] = await Promise.all([
      prisma.driver.count(),
      prisma.driver.count({ where: { status: 'ACTIVE' } })
    ])

    // Get recent metrics for average score calculation
    const recentMetrics = await prisma.driverMetrics.findMany({
      where: {
        createdAt: { gte: startDate }
      },
      orderBy: { createdAt: 'desc' }
    })

    const averageScore = recentMetrics.length > 0 
      ? recentMetrics.reduce((sum, metric) => sum + metric.calculatedScore, 0) / recentMetrics.length 
      : 0

    // Get alerts sent in timeframe
    const alertsSent = await prisma.alertRecord.count({
      where: {
        createdAt: { gte: startDate },
        status: 'SENT'
      }
    })

    // Get top performers (drivers with recent metrics)
    const topPerformers = await prisma.driver.findMany({
      include: {
        metrics: {
          orderBy: { date: 'desc' },
          take: 1
        }
      },
      take: 5
    })

    const topPerformersWithScores = topPerformers
      .filter(driver => driver.metrics.length > 0)
      .map(driver => ({
        driverId: driver.id,
        name: driver.name,
        score: driver.metrics[0].calculatedScore
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)

    // Get underperformers
    const underPerformers = await prisma.driver.findMany({
      include: {
        metrics: {
          orderBy: { date: 'desc' },
          take: 1
        },
        alerts: {
          where: {
            status: 'PENDING',
            createdAt: { gte: startDate }
          }
        }
      }
    })

    const underPerformersWithScores = underPerformers
      .filter(driver => driver.metrics.length > 0 && driver.metrics[0].calculatedScore < 0.7)
      .map(driver => ({
        driverId: driver.id,
        name: driver.name,
        score: driver.metrics[0].calculatedScore,
        alertsPending: driver.alerts.length
      }))
      .sort((a, b) => a.score - b.score)
      .slice(0, 5)

    // Get trip completion stats from real data or indicate not available
    let tripsCompleted = 0
    let tripsInProgress = 0
    try {
      const uberAPI = getUberAPI()
      const orgId = process.env.UBER_ORG_ID
      if (orgId) {
        // Fetch all trips for the org in the time range
        const trips = await uberAPI.getTrips(startDate, now)
        if (Array.isArray(trips)) {
          tripsCompleted = trips.filter((t: any) => t.status === 'completed').length
          tripsInProgress = trips.filter((t: any) => t.status === 'in_progress').length
        }
      }
    } catch (err) {
      console.warn('Uber API trip fetch failed, using fallback:', err)
    }

    return NextResponse.json({
      success: true,
      data: {
        totalDrivers,
        activeDrivers,
        averageScore,
        alertsSent,
        tripsCompleted,
        tripsInProgress,
        topPerformers: topPerformersWithScores,
        underPerformers: underPerformersWithScores,
        timeRange
      },
      timestamp: new Date()
    })

  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch dashboard statistics',
      timestamp: new Date()
    }, { status: 500 })
  }
} 