import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../libs/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '7d'
    
    // Calculate date range
    const now = new Date()
    let startDate: Date
    let groupBy: 'hour' | 'day' | 'week'
    
    switch (timeRange) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        groupBy = 'hour'
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        groupBy = 'day'
        break
      case '7d':
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        groupBy = 'day'
        break
    }

    // Generate time series data for charts
    const generateTimePoints = () => {
      const points = []
      const interval = groupBy === 'hour' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000
      
      for (let time = startDate.getTime(); time <= now.getTime(); time += interval) {
        points.push(new Date(time))
      }
      return points
    }

    const timePoints = generateTimePoints()

    // Score trend data
    const scoreHistory = await prisma.driverMetrics.findMany({
      where: {
        createdAt: { gte: startDate }
      },
      orderBy: { createdAt: 'asc' }
    })

    const scoreTrend = timePoints.map(point => {
      const pointMetrics = scoreHistory.filter(metric => {
        const metricTime = new Date(metric.createdAt)
        if (groupBy === 'hour') {
          return metricTime.getHours() === point.getHours() && 
                 metricTime.getDate() === point.getDate()
        }
        return metricTime.getDate() === point.getDate()
      })
      
      const avgScore = pointMetrics.length > 0 
        ? pointMetrics.reduce((sum, m) => sum + m.calculatedScore, 0) / pointMetrics.length 
        : 0
      
      return {
        time: point.toISOString(),
        score: Math.round(avgScore * 100),
        label: groupBy === 'hour' 
          ? point.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          : point.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }
    })

    // Alert frequency data
    const alertHistory = await prisma.alertRecord.findMany({
      where: {
        createdAt: { gte: startDate }
      },
      orderBy: { createdAt: 'asc' }
    })

    const alertTrend = timePoints.map(point => {
      const pointAlerts = alertHistory.filter(alert => {
        const alertTime = new Date(alert.createdAt)
        if (groupBy === 'hour') {
          return alertTime.getHours() === point.getHours() && 
                 alertTime.getDate() === point.getDate()
        }
        return alertTime.getDate() === point.getDate()
      })
      
      return {
        time: point.toISOString(),
        alerts: pointAlerts.length,
        label: groupBy === 'hour' 
          ? point.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          : point.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }
    })

    // Performance distribution
    const latestMetrics = await prisma.driverMetrics.findMany({
      include: {
        driver: true
      },
      orderBy: { createdAt: 'desc' },
      take: 100 // Get recent metrics
    })

    const performanceDistribution = [
      { grade: 'A+', count: latestMetrics.filter(m => m.calculatedScore >= 0.95).length, color: '#22c55e' },
      { grade: 'A', count: latestMetrics.filter(m => m.calculatedScore >= 0.9 && m.calculatedScore < 0.95).length, color: '#84cc16' },
      { grade: 'B+', count: latestMetrics.filter(m => m.calculatedScore >= 0.85 && m.calculatedScore < 0.9).length, color: '#eab308' },
      { grade: 'B', count: latestMetrics.filter(m => m.calculatedScore >= 0.8 && m.calculatedScore < 0.85).length, color: '#f59e0b' },
      { grade: 'C+', count: latestMetrics.filter(m => m.calculatedScore >= 0.75 && m.calculatedScore < 0.8).length, color: '#f97316' },
      { grade: 'C', count: latestMetrics.filter(m => m.calculatedScore >= 0.7 && m.calculatedScore < 0.75).length, color: '#ef4444' },
      { grade: 'D', count: latestMetrics.filter(m => m.calculatedScore >= 0.6 && m.calculatedScore < 0.7).length, color: '#dc2626' },
      { grade: 'F', count: latestMetrics.filter(m => m.calculatedScore < 0.6).length, color: '#991b1b' }
    ]

    // Channel effectiveness from real alert data
    const channelStats = await prisma.alertRecord.groupBy({
      by: ['alertType'],
      where: {
        createdAt: { gte: startDate }
      },
      _count: {
        _all: true
      }
    })

    const responseStats = await prisma.alertRecord.groupBy({
      by: ['alertType'],
      where: {
        createdAt: { gte: startDate },
        status: 'READ'
      },
      _count: {
        _all: true
      }
    })

    const channelEffectiveness = channelStats.map(stat => {
      const responses = responseStats.find(r => r.alertType === stat.alertType)?._count._all || 0
      const sent = stat._count._all || 0
      return {
        channel: stat.alertType,
        sent,
        responded: responses,
        responseRate: sent > 0 ? Math.round((responses / sent) * 100) : 0
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        scoreTrend,
        alertTrend,
        performanceDistribution,
        channelEffectiveness,
        timeRange,
        groupBy
      },
      timestamp: new Date()
    })

  } catch (error) {
    console.error('Error fetching dashboard charts:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch dashboard charts data',
      timestamp: new Date()
    }, { status: 500 })
  }
} 