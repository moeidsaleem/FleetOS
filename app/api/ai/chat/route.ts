import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  const { messages, fleetData } = await req.json()

  // Get the latest message from the user
  const lastMessage = messages[messages.length - 1]?.content || ''

  // Fetch real-time fleet data if not provided
  let currentFleetData = fleetData
  if (!currentFleetData) {
    try {
      const drivers = await prisma.driver.findMany({
        take: 1000,
        include: {
          metrics: {
            orderBy: { date: 'desc' },
            take: 1
          },
          alerts: {
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        }
      })
      
      const activeDrivers = drivers.filter(d => d.status === 'ACTIVE').length
      const avgScore = drivers.reduce((sum, d) => {
        const latestScore = d.metrics?.[0]?.calculatedScore || 0
        return sum + latestScore
      }, 0) / drivers.length
      const totalAlerts = drivers.reduce((sum, d) => sum + (d.alerts?.length || 0), 0)

      currentFleetData = {
        totalDrivers: drivers.length,
        activeDrivers,
        avgPerformance: Math.round(avgScore * 100) || 0,
        alerts: totalAlerts,
        drivers: drivers.slice(0, 10).map(d => ({
          name: d.name,
          status: d.status,
          score: d.metrics?.[0]?.calculatedScore || 0,
          phone: d.phone
        }))
      }
    } catch (error) {
      console.error('Error fetching fleet data:', error)
      currentFleetData = {
        totalDrivers: 0,
        activeDrivers: 0,
        avgPerformance: 0,
        alerts: 0,
        drivers: []
      }
    }
  }

  // Get comprehensive database data for the AI
  const databaseData = await getDatabaseData()

  const result = await streamText({
    model: openai('gpt-4o-mini'),
    system: `You are Fleet Commander AI, an intelligent assistant for Bachman Inc.'s fleet management operations. You have access to the complete Supabase database and can analyze real fleet data.

**CURRENT FLEET STATUS**:
- Total Drivers: ${currentFleetData.totalDrivers}
- Active Drivers: ${currentFleetData.activeDrivers}
- Average Performance: ${currentFleetData.avgPerformance}%
- Active Alerts: ${currentFleetData.alerts}

**DATABASE ACCESS**: You have access to the following tables:
- drivers: Driver information, status, contact details
- driver_metrics: Performance metrics, scores, analytics data
- alert_records: Alerts, notifications, and communication history
- alert_rules: Automated alert rules and conditions
- notification_templates: Message templates for communications
- driver_documents: Driver documents and compliance tracking
- driver_notes: Notes and comments about drivers
- uber_sync_logs: Uber API synchronization history
- users: System users and their roles

**DATABASE SUMMARY**:
${JSON.stringify(databaseData.summary, null, 2)}

**TOP PERFORMING DRIVERS** (by calculated score):
${JSON.stringify(databaseData.topPerformers?.map(d => ({
  name: d.name,
  status: d.status,
  uberDriverId: d.uberDriverId,
  currentScore: d.currentScore,
  recentAlerts: d.recentAlertsCount
})), null, 2)}

**DRIVERS NEEDING ATTENTION** (low scores or high alerts):
${JSON.stringify(databaseData.underPerformers?.map(d => ({
  name: d.name,
  status: d.status,
  currentScore: d.currentScore,
  recentAlerts: d.recentAlertsCount,
  issues: d.issues
})), null, 2)}

**RECENT PERFORMANCE METRICS** (last 10):
${JSON.stringify(databaseData.recentMetrics?.map(m => ({
  driverName: m.driver?.name,
  date: m.date,
  calculatedScore: m.calculatedScore,
  acceptanceRate: m.acceptanceRate,
  completionRate: m.completionRate
})), null, 2)}

**RECENT ALERTS** (last 10):
${JSON.stringify(databaseData.recentAlerts?.map(a => ({
  driverName: a.driver?.name,
  alertType: a.alertType,
  priority: a.priority,
  reason: a.reason,
  status: a.status,
  createdAt: a.createdAt
})), null, 2)}

**CAPABILITIES**:
- Real-time fleet monitoring with live database access
- Driver performance analysis using actual metrics
- Alert management and communication tracking
- Data synchronization monitoring
- Detailed report generation with real data
- Performance insights based on calculated scores
- Identify top performers and underperformers
- Track driver compliance and document status

**PERSONALITY**:
- Professional but friendly
- Data-driven and analytical
- Proactive in suggesting improvements
- Clear and concise communication
- Use emojis appropriately for better UX

**When responding**:
1. Always use the actual database data provided above
2. Be specific about driver names, scores, and metrics from the database
3. Identify top performers using calculated scores
4. Highlight drivers needing attention based on low scores or high alerts
5. Provide actionable insights based on real performance data
6. Suggest concrete next steps with specific driver names
7. Format responses clearly with bullet points when appropriate
8. Use the recent metrics and alerts data for context

**Remember**: You're managing a real fleet for Bachman Inc. with access to live Supabase data, so be precise, data-driven, and professional.`,
    messages,
    onFinish: async (result) => {
      console.log('AI Chat completed:', result.usage)
    }
  })

  return result.toTextStreamResponse()
}

async function getDatabaseData() {
  try {
    // Get comprehensive database data
    const [
      drivers,
      driverMetrics,
      alertRecords,
      summary
    ] = await Promise.all([
      prisma.driver.findMany({
        take: 100,
        include: {
          metrics: {
            orderBy: { date: 'desc' },
            take: 7 // Last 7 days
          },
          alerts: {
            orderBy: { createdAt: 'desc' },
            take: 5 // Last 5 alerts
          }
        },
        orderBy: { joinedAt: 'desc' }
      }),
      prisma.driverMetrics.findMany({
        take: 50,
        include: {
          driver: {
            select: {
              name: true,
              uberDriverId: true,
              status: true
            }
          }
        },
        orderBy: { date: 'desc' }
      }),
      prisma.alertRecord.findMany({
        take: 50,
        include: {
          driver: {
            select: {
              name: true,
              uberDriverId: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      getSummaryStatistics()
    ])

    // Identify top performers and underperformers
    const topPerformers = drivers
      .filter(d => d.metrics && d.metrics.length > 0)
      .map(d => ({
        ...d,
        currentScore: d.metrics[0]?.calculatedScore || 0,
        recentAlertsCount: d.alerts?.length || 0
      }))
      .sort((a, b) => b.currentScore - a.currentScore)
      .slice(0, 10)

    const underPerformers = drivers
      .filter(d => {
        const currentScore = d.metrics?.[0]?.calculatedScore || 0
        const recentAlerts = d.alerts?.length || 0
        return currentScore < 50 || recentAlerts > 3
      })
      .map(d => ({
        ...d,
        currentScore: d.metrics?.[0]?.calculatedScore || 0,
        recentAlertsCount: d.alerts?.length || 0,
        issues: [
          ...(d.metrics?.[0]?.calculatedScore < 50 ? ['Low performance score'] : []),
          ...(d.alerts?.length > 3 ? ['High alert count'] : []),
          ...(d.status !== 'ACTIVE' ? ['Inactive status'] : [])
        ]
      }))
      .slice(0, 10)

    return {
      drivers,
      driverMetrics,
      alertRecords,
      summary,
      topPerformers,
      underPerformers,
      recentMetrics: driverMetrics.slice(0, 10),
      recentAlerts: alertRecords.slice(0, 10)
    }
  } catch (error) {
    console.error('Error fetching database data for AI:', error)
    return {
      drivers: [],
      driverMetrics: [],
      alertRecords: [],
      summary: {},
      topPerformers: [],
      underPerformers: [],
      recentMetrics: [],
      recentAlerts: []
    }
  }
}

async function getSummaryStatistics() {
  try {
    const [
      totalDrivers,
      activeDrivers,
      totalAlerts,
      recentAlerts,
      avgScore
    ] = await Promise.all([
      prisma.driver.count(),
      prisma.driver.count({ where: { status: 'ACTIVE' } }),
      prisma.alertRecord.count(),
      prisma.alertRecord.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      prisma.driverMetrics.aggregate({
        _avg: { calculatedScore: true }
      })
    ])

    return {
      totalDrivers,
      activeDrivers,
      inactiveDrivers: totalDrivers - activeDrivers,
      totalAlerts,
      recentAlerts,
      averageScore: avgScore._avg.calculatedScore || 0
    }
  } catch (error) {
    console.error('Error fetching summary statistics:', error)
    return {}
  }
}
