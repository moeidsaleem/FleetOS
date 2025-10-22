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
          lastMetrics: true
        }
      })
      
      const activeDrivers = drivers.filter(d => d.status === 'ACTIVE').length
      const avgScore = drivers.reduce((sum, d) => sum + (d.currentScore || 0), 0) / drivers.length
      const totalAlerts = drivers.reduce((sum, d) => sum + (d.recentAlertsCount || 0), 0)

      currentFleetData = {
        totalDrivers: drivers.length,
        activeDrivers,
        avgPerformance: Math.round(avgScore * 100) || 0,
        alerts: totalAlerts,
        drivers: drivers.slice(0, 10).map(d => ({
          name: d.name,
          status: d.status,
          score: d.currentScore,
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

  const result = await streamText({
    model: openai('gpt-4o-mini'),
    system: `You are Fleet Commander AI, an intelligent assistant for Bachman Inc.'s fleet management operations. You help manage drivers, monitor performance, send alerts, and provide insights.

CURRENT FLEET STATUS:
- Total Drivers: ${currentFleetData.totalDrivers}
- Active Drivers: ${currentFleetData.activeDrivers}
- Average Performance: ${currentFleetData.avgPerformance}%
- Active Alerts: ${currentFleetData.alerts}

AVAILABLE COMMANDS:
- "Show fleet status" - Display current fleet overview
- "Send alert to [driver name]" - Send alert to specific driver
- "Performance report" - Generate performance analytics
- "Driver details [name]" - Get specific driver information
- "Sync with Uber" - Sync latest data from Uber API
- "Export data" - Export fleet information
- "Help" - Show available commands

CAPABILITIES:
- Real-time fleet monitoring
- Driver performance analysis
- Alert management
- Data synchronization
- Report generation
- Performance insights

PERSONALITY:
- Professional but friendly
- Data-driven and analytical
- Proactive in suggesting improvements
- Clear and concise communication
- Use emojis appropriately for better UX

When responding:
1. Always provide actionable insights
2. Use current fleet data to support recommendations
3. Be specific about driver names, scores, and metrics
4. Suggest concrete next steps
5. Format responses clearly with bullet points when appropriate
6. If asked about specific drivers, use the provided driver data

Remember: You're managing a real fleet for Bachman Inc., so be precise and professional.`,
    messages,
    onFinish: async (result) => {
      console.log('AI Chat completed:', result.usage)
    }
  })

  return result.toDataStreamResponse()
}
