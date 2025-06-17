import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../libs/database'
import { sendDriverAlert } from '../../../../libs/alerts'
import { z } from 'zod'

// Request validation schema
const AlertRequestSchema = z.object({
  driverId: z.string().uuid(),
  channel: z.enum(['whatsapp', 'telegram', 'voice']),
  message: z.string().min(1)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validatedData = AlertRequestSchema.parse(body)
    const { driverId, channel, message } = validatedData

    // Check if driver exists
    const driver = await prisma.driver.findUnique({
      where: { id: driverId }
    })

    if (!driver) {
      return NextResponse.json({
        success: false,
        error: 'Driver not found'
      }, { status: 404 })
    }

    // For voice calls, redirect to the new alert-call endpoint
    if (channel === 'voice') {
      return NextResponse.json({
        success: false,
        error: 'Voice calls should use the /api/drivers/alert-call endpoint with the new modal interface'
      }, { status: 400 })
    }

    // Send alert using the existing alert orchestrator
    const alertResult = await sendDriverAlert({
      driverId,
      reason: 'Manual alert',
      channels: [channel],
      customMessage: message
    })

    if (alertResult.success) {
      return NextResponse.json({
        success: true,
        data: {
          alertId: alertResult.alertId,
          channel,
          message: `${channel} alert sent successfully`
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        error: alertResult.error || `Failed to send ${channel} alert`
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Alert API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
} 