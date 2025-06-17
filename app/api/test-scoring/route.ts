import { NextRequest, NextResponse } from 'next/server'
import { calculateDriverScore, getScoreBreakdown, type DriverPerformanceInput } from '../../../libs/driver-scoring'

// POST /api/test-scoring - Test the driver scoring algorithm
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Example driver metrics for testing
    const testMetrics: DriverPerformanceInput = body.metrics || {
      acceptanceRate: 0.85,
      cancellationRate: 0.1,
      completionRate: 0.9,
      feedbackScore: 4.7,
      tripVolumeIndex: 0.75,
      idleRatio: 0.2
    }

    // Calculate score
    const score = calculateDriverScore(testMetrics)
    const breakdown = getScoreBreakdown(testMetrics)

    return NextResponse.json({
      success: true,
      data: {
        inputMetrics: testMetrics,
        calculatedScore: score,
        scorePercentage: Math.round(score * 100),
        breakdown: breakdown,
        formula: {
          description: "score = (acceptanceRate * 0.3) + ((1 - cancellationRate) * 0.2) + (completionRate * 0.15) + (feedbackScore / 5 * 0.15) + (tripVolumeIndex * 0.1) + ((1 - idleRatio) * 0.1)",
          weights: {
            acceptanceRate: "30%",
            cancellationRate: "20% (inverted)",
            completionRate: "15%",
            feedbackScore: "15% (normalized)",
            tripVolumeIndex: "10%",
            idleRatio: "10% (inverted)"
          }
        }
      },
      timestamp: new Date()
    })

  } catch (error) {
    console.error('Error in test scoring:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate score',
      timestamp: new Date()
    }, { status: 400 })
  }
}

// GET /api/test-scoring - Get example metrics for testing
export async function GET() {
  const exampleDrivers = [
    {
      name: "Excellent Driver",
      metrics: {
        acceptanceRate: 0.95,
        cancellationRate: 0.05,
        completionRate: 0.98,
        feedbackScore: 4.9,
        tripVolumeIndex: 0.9,
        idleRatio: 0.1
      }
    },
    {
      name: "Good Driver",
      metrics: {
        acceptanceRate: 0.85,
        cancellationRate: 0.1,
        completionRate: 0.9,
        feedbackScore: 4.5,
        tripVolumeIndex: 0.75,
        idleRatio: 0.2
      }
    },
    {
      name: "Average Driver",
      metrics: {
        acceptanceRate: 0.75,
        cancellationRate: 0.15,
        completionRate: 0.8,
        feedbackScore: 4.0,
        tripVolumeIndex: 0.6,
        idleRatio: 0.3
      }
    },
    {
      name: "Poor Driver",
      metrics: {
        acceptanceRate: 0.6,
        cancellationRate: 0.25,
        completionRate: 0.7,
        feedbackScore: 3.5,
        tripVolumeIndex: 0.4,
        idleRatio: 0.4
      }
    }
  ]

  const results = exampleDrivers.map(driver => {
    const score = calculateDriverScore(driver.metrics)
    const breakdown = getScoreBreakdown(driver.metrics)
    
    return {
      ...driver,
      calculatedScore: score,
      scorePercentage: Math.round(score * 100),
      grade: breakdown.grade,
      category: breakdown.category
    }
  })

  return NextResponse.json({
    success: true,
    data: {
      examples: results,
      instructions: "POST to this endpoint with 'metrics' object to test custom values"
    },
    timestamp: new Date()
  })
} 