import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../libs/database'
import { getUberAPI } from '../../../../libs/uber-api'
import { calculateDriverScore, getScoreBreakdown } from '../../../../libs/driver-scoring'
import { DriverSchema } from '../../../../types'
import { z } from 'zod'

// GET /api/drivers/[id] - Get detailed driver information
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')
    const includeUberData = searchParams.get('includeUberData') === 'true'

    // Get driver from local database
    const driver = await prisma.driver.findUnique({
      where: { id },
      include: {
        metrics: {
          orderBy: { date: 'desc' },
          take: 30 // Last 30 days of metrics
        },
        alerts: {
          orderBy: { createdAt: 'desc' },
          take: 10 // Last 10 alerts
        }
      }
    })

    if (!driver) {
      return NextResponse.json({
        success: false,
        error: 'Driver not found',
        timestamp: new Date()
      }, { status: 404 })
    }

    // Get additional data from Uber if requested and driver has Uber ID
    let uberData = null
    if (includeUberData && driver.uberDriverId) {
      try {
        const uberAPI = getUberAPI()
        // You may want to fetch more detailed analytics here if needed
        const details = await uberAPI.getDriver(driver.uberDriverId)
        // Optionally, fetch trips or analytics data as needed
        uberData = { details }
      } catch (error) {
        console.error('Error fetching Uber data:', error)
        // Continue without Uber data
      }
    }

    // Calculate current performance score
    const latestMetrics = driver.metrics[0]
    let currentScore = 0
    let scoreBreakdown = null
    let analyticsMetrics = null
    let analyticsScore = 0
    
    if (latestMetrics) {
      const performanceData = {
        acceptanceRate: latestMetrics.acceptanceRate,
        cancellationRate: latestMetrics.cancellationRate,
        completionRate: latestMetrics.completionRate,
        feedbackScore: latestMetrics.feedbackScore,
        tripVolumeIndex: latestMetrics.tripVolumeIndex,
        idleRatio: latestMetrics.idleRatio,
      }
      
      currentScore = calculateDriverScore(performanceData)
      scoreBreakdown = getScoreBreakdown(performanceData)
      analyticsMetrics = latestMetrics.analyticsMetrics || null
      analyticsScore = latestMetrics.calculatedScore || 0
    }

    // Calculate performance trends
    const performanceTrend = driver.metrics.slice(0, 7).map(metric => ({
      date: metric.date,
      score: metric.calculatedScore,
      acceptance: metric.acceptanceRate,
      cancellation: metric.cancellationRate,
      completion: metric.completionRate,
      feedback: metric.feedbackScore
    }))

    // Calculate summary statistics
    const recentMetrics = driver.metrics.slice(0, days)
    const avgScore = recentMetrics.length > 0
      ? recentMetrics.reduce((sum, m) => sum + m.calculatedScore, 0) / recentMetrics.length
      : 0

    const response = {
      success: true,
      data: {
        driver: {
          id: driver.id,
          name: driver.name,
          email: driver.email,
          phone: driver.phone,
          whatsappNumber: driver.whatsappNumber,
          telegramUserId: driver.telegramUserId,
          status: driver.status,
          uberDriverId: driver.uberDriverId,
          joinedAt: driver.joinedAt,
          updatedAt: driver.updatedAt
        },
        performance: {
          currentScore,
          avgScore,
          scoreBreakdown,
          analyticsMetrics,
          analyticsScore,
          trend: performanceTrend,
          metricsCount: driver.metrics.length
        },
        alerts: {
          recent: driver.alerts.map(alert => ({
            id: alert.id,
            type: alert.alertType,
            priority: alert.priority,
            reason: alert.reason,
            status: alert.status,
            sentAt: alert.sentAt,
            createdAt: alert.createdAt
          })),
          totalCount: driver.alerts.length
        },
        uber: uberData,
        summary: {
          totalMetrics: driver.metrics.length,
          totalAlerts: driver.alerts.length,
          lastMetricDate: latestMetrics?.date || null,
          memberSince: driver.joinedAt
        }
      },
      timestamp: new Date()
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching driver details:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch driver details',
      timestamp: new Date()
    }, { status: 500 })
  }
}

// PUT /api/drivers/[id] - Update driver information
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await request.json()

    // Update driver in database
    const driver = await prisma.driver.update({
      where: { id },
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        whatsappNumber: body.whatsappNumber,
        telegramUserId: body.telegramUserId,
        status: body.status,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: driver,
      timestamp: new Date()
    })

  } catch (error) {
    console.error('Error updating driver:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update driver',
      timestamp: new Date()
    }, { status: 500 })
  }
}

// DELETE /api/drivers/[id] - Delete driver
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    // Delete driver and related data (cascades via schema)
    await prisma.driver.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Driver deleted successfully',
      timestamp: new Date()
    })

  } catch (error) {
    console.error('Error deleting driver:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete driver',
      timestamp: new Date()
    }, { status: 500 })
  }
}

// PATCH /api/drivers/[id] - Update driver information
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await request.json()
    
    // Create a partial schema for updates
    const UpdateDriverSchema = DriverSchema.omit({ 
      id: true, 
      joinedAt: true, 
      updatedAt: true 
    }).partial()
    
    const validatedData = UpdateDriverSchema.parse(body)

    // Check if driver exists
    const existingDriver = await prisma.driver.findUnique({
      where: { id }
    })

    if (!existingDriver) {
      return NextResponse.json({
        success: false,
        error: 'Driver not found',
        timestamp: new Date()
      }, { status: 404 })
    }

    // Check for conflicts with email or uberDriverId if they're being updated
    if (validatedData.email || validatedData.uberDriverId) {
      const conflictWhere = {
        AND: [
          { id: { not: id } }, // Exclude current driver
          {
            OR: [
              ...(validatedData.email ? [{ email: validatedData.email }] : []),
              ...(validatedData.uberDriverId ? [{ uberDriverId: validatedData.uberDriverId }] : [])
            ]
          }
        ]
      }

      const conflictingDriver = await prisma.driver.findFirst({
        where: conflictWhere
      })

      if (conflictingDriver) {
        return NextResponse.json({
          success: false,
          error: 'Another driver with this email or Uber ID already exists',
          timestamp: new Date()
        }, { status: 400 })
      }
    }

    // Update the driver
    const updatedDriver = await prisma.driver.update({
      where: { id },
      data: validatedData
    })

    return NextResponse.json({
      success: true,
      data: updatedDriver,
      timestamp: new Date()
    })

  } catch (error) {
    console.error('Error updating driver:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation error',
        details: error.errors,
        timestamp: new Date()
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to update driver',
      timestamp: new Date()
    }, { status: 500 })
  }
}

// GET /api/drivers/[id]/activity - Unified activity feed for timeline
export async function GET_ACTIVITY(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    // Fetch alerts
    const alerts = await prisma.alertRecord.findMany({
      where: { driverId: id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        alertType: true,
        reason: true,
        status: true,
        priority: true,
        message: true,
      }
    })
    // Fetch document uploads
    const documents = await prisma.driverDocument.findMany({
      where: { driverId: id },
      orderBy: { uploadedAt: 'desc' },
      select: {
        id: true,
        uploadedAt: true,
        type: true,
        fileName: true,
        status: true,
        expiryDate: true,
      }
    })
    // Fetch status changes (from AlertRecord or add a StatusChange model in future)
    // For now, infer from alerts with reason/status 'status change' or similar
    // Optionally, add more sources (e.g., trip completions)
    // Compose activity events
    const activity = [
      ...alerts.map(a => ({
        type: 'alert',
        id: a.id,
        timestamp: a.createdAt,
        description: `Alert: ${a.reason}`,
        meta: a
      })),
      ...documents.map(d => ({
        type: 'document',
        id: d.id,
        timestamp: d.uploadedAt,
        description: `Document uploaded: ${d.type} (${d.fileName})`,
        meta: d
      })),
      // Add more event types here as needed
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    return NextResponse.json({ success: true, data: activity })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch activity feed' }, { status: 500 })
  }
} 