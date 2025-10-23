import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../libs/database'
import { DriverSchema } from '../../../types'
import { z } from 'zod'
import { DriverStatus, Prisma } from '@prisma/client'
import { UberSyncService } from '../../../libs/uber-sync'
import { parse } from 'json2csv'
import formidable from 'formidable'
import fs from 'fs/promises'
import Papa from 'papaparse'
import type { Fields, Files, File } from 'formidable'
import { getGradeFromScore } from '../../../libs/driver-scoring'

// Instantiate the UberSyncService
const uberSyncService = new UberSyncService()

// GET /api/drivers - List all drivers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const uberDriverId = searchParams.get('uberDriverId')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const driverId = searchParams.get('driverId')
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const reason = searchParams.get('reason')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    // If email or uberDriverId is present, filter by those fields only
    if (email || uberDriverId) {
      const where: any = {}
      if (email) where.email = email
      if (uberDriverId) where.uberDriverId = uberDriverId
      const drivers = await prisma.driver.findMany({ where })
      return NextResponse.json({ success: true, data: drivers })
    }

    // If no alert filters are present, return all drivers with performance and alert data
    if (!driverId && !type && !status && !reason && !from && !to) {
      // Use a single query with includes to fetch all data at once
      const drivers = await prisma.driver.findMany({
        include: {
          metrics: {
            orderBy: { date: 'desc' },
            take: 1 // Only get the latest metric
          },
          alerts: {
            select: { id: true } // Only count alerts, don't fetch full data
          }
        },
        orderBy: { joinedAt: 'desc' },
        take: limit,
        skip: offset
      })

      // Process the data efficiently
      const driverData = drivers.map((driver) => {
        const lastMetric = driver.metrics[0] // Get the latest metric
        const recentAlertsCount = driver.alerts.length // Count alerts
        
        // Calculate grade from calculatedScore
        let grade = null
        if (lastMetric && typeof lastMetric.calculatedScore === 'number') {
          grade = getGradeFromScore(lastMetric.calculatedScore)
        }

        return {
          ...driver,
          lastMetrics: lastMetric ? {
            calculatedScore: lastMetric.calculatedScore,
            acceptanceRate: lastMetric.acceptanceRate,
            cancellationRate: lastMetric.cancellationRate,
            completionRate: lastMetric.completionRate,
            feedbackScore: lastMetric.feedbackScore,
            tripVolume: lastMetric.tripVolumeIndex,
            idleRatio: lastMetric.idleRatio,
            grade
          } : null,
          currentScore: lastMetric ? lastMetric.calculatedScore : null,
          recentAlertsCount,
          // Remove the included relations to avoid circular references
          metrics: undefined,
          alerts: undefined
        }
      })

      return NextResponse.json({ success: true, data: driverData })
    }

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

// POST /api/drivers - Create a new driver
/**
 * POST /api/drivers
 * Creates a new driver record in the database
 * 
 * @param request - The incoming HTTP request containing driver data
 * @returns JSON response with created driver data or error message
 */
export async function POST(request: NextRequest) {
  console.log('POST /api/drivers - Creating new driver')
  try {
    // Parse the request body into JSON
    const body = await request.json()
    console.log('Received request body:', body)
    
    // Create a validation schema by omitting auto-generated fields
    // from the base DriverSchema
    const CreateDriverSchema = DriverSchema.omit({ 
      id: true, // UUID will be generated by database
      joinedAt: true, // Will be set to current timestamp
      updatedAt: true // Will be set to current timestamp
    })
    console.log('Created validation schema')
    
    // Validate the request data against our schema
    const validatedData = CreateDriverSchema.parse(body)
    console.log('Data validation successful:', validatedData)

    // Check for existing drivers with same email or Uber ID
    // to prevent duplicate entries
    console.log('Checking for existing drivers with email:', validatedData.email, 'or Uber ID:', validatedData.uberDriverId)
    const existingDriver = await prisma.driver.findFirst({
      where: {
        OR: [
          { email: validatedData.email },
          { uberDriverId: validatedData.uberDriverId }
        ]
      }
    })

    // Return error if driver already exists
    if (existingDriver) {
      console.log('Driver already exists:', existingDriver)
      return NextResponse.json({
        success: false,
        error: 'Driver with this email or Uber ID already exists',
        timestamp: new Date()
      }, { status: 400 })
    }

    // Create new driver record in database
    // Type assertion needed due to Prisma's type system
    console.log('Creating new driver record with data:', validatedData)
    const driver = await prisma.driver.create({
      data: validatedData as unknown as Prisma.DriverCreateInput
    })
    console.log('Driver created successfully:', driver)

    // Return success response with created driver data
    return NextResponse.json({
      success: true,
      data: driver,
      timestamp: new Date()
    }, { status: 201 })

  } catch (error) {
    // Log the error for debugging
    console.error('Error creating driver:', error)
    
    // Handle validation errors specifically
    if (error instanceof z.ZodError) {
      console.log('Validation error details:', error.errors)
      return NextResponse.json({
        success: false,
        error: 'Validation error',
        details: error.errors,
        timestamp: new Date()
      }, { status: 400 })
    }

    // Handle all other errors
    console.error('Unexpected error occurred:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create driver',
      timestamp: new Date()
    }, { status: 500 })
  }
}

