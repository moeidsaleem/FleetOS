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
      customMessage: message,
      triggeredBy: 'MANUAL',
    })

    if (alertResult.success) {
      return NextResponse.json({
        success: true,
        data: alertResult.alertRecord
      })
    } else {
      return NextResponse.json({
        success: false,
        error: alertResult.error || `Failed to send ${channel} alert`,
        data: alertResult.alertRecord
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const driverId = searchParams.get('driverId')
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const reason = searchParams.get('reason')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const where: any = {}
    if (driverId) where.driverId = driverId
    if (type) where.alertType = type.toUpperCase()
    if (status) where.status = status.toUpperCase()
    if (reason) where.reason = reason
    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from)
      if (to) where.createdAt.lte = new Date(to)
    }

    const alerts = await prisma.alertRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      include: { driver: true }
    })
    const total = await prisma.alertRecord.count({ where })
    return NextResponse.json({
      success: true,
      data: alerts.map(alert => ({
        ...alert,
        conversationId: alert.conversationId
      })),
      total
    })
  } catch (error) {
    console.error('Failed to fetch alerts:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch alerts' }, { status: 500 })
  }
}

// PATCH /api/drivers/alert - Update alert status (e.g., mark as read)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { alertId, status } = body
    if (!alertId || !status) {
      return NextResponse.json({ success: false, error: 'alertId and status are required' }, { status: 400 })
    }
    const updateData: any = { status: status.toUpperCase() }
    if (status.toUpperCase() === 'READ') {
      updateData.readAt = new Date()
    } else if (status.toUpperCase() === 'DELIVERED') {
      updateData.deliveredAt = new Date()
    }
    const updated = await prisma.alertRecord.update({
      where: { id: alertId },
      data: updateData
    })
    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Failed to update alert:', error)
    return NextResponse.json({ success: false, error: 'Failed to update alert' }, { status: 500 })
  }
} 