import { z } from 'zod'

/**
 * Driver Metrics Schema - Validates input data for driver performance metrics
 */
export const DriverMetricsSchema = z.object({
  acceptanceRate: z.number().min(0).max(1).describe('Rate of trip requests accepted (0-1)'),
  cancellationRate: z.number().min(0).max(1).describe('Rate of trips cancelled by driver (0-1)'),
  completionRate: z.number().min(0).max(1).describe('Rate of trips completed successfully (0-1)'),
  feedbackScore: z.number().min(0).max(5).describe('Average customer feedback score (0-5)'),
  tripVolumeIndex: z.number().min(0).max(1).describe('Trip volume relative to fleet average (0-1)'),
  idleRatio: z.number().min(0).max(1).describe('Ratio of idle time to total online time (0-1)'),
})

export type DriverMetrics = z.infer<typeof DriverMetricsSchema>

/**
 * Driver Score Result Schema
 */
export const DriverScoreResultSchema = z.object({
  score: z.number().min(0).max(1),
  breakdown: z.object({
    acceptanceContribution: z.number(),
    cancellationContribution: z.number(),
    completionContribution: z.number(),
    feedbackContribution: z.number(),
    volumeContribution: z.number(),
    idleContribution: z.number(),
  }),
  grade: z.enum(['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F']),
  status: z.enum(['excellent', 'good', 'average', 'poor', 'critical']),
})

export type DriverScoreResult = z.infer<typeof DriverScoreResultSchema>

/**
 * Driver performance input schema
 */
export const DriverPerformanceSchema = z.object({
  acceptanceRate: z.number().min(0).max(1),
  cancellationRate: z.number().min(0).max(1),
  completionRate: z.number().min(0).max(1),
  feedbackScore: z.number().min(0).max(5),
  tripVolumeIndex: z.number().min(0).max(1),
  idleRatio: z.number().min(0).max(1),
})

export type DriverPerformanceInput = z.infer<typeof DriverPerformanceSchema>

/**
 * Calculate driver score using weighted metrics
 * 
 * Formula:
 * score = (acceptanceRate * 0.3) + ((1 - cancellationRate) * 0.2) + 
 *         (completionRate * 0.15) + (feedbackScore / 5 * 0.15) + 
 *         (tripVolumeIndex * 0.1) + ((1 - idleRatio) * 0.1)
 * 
 * @param metrics - Driver performance metrics
 * @returns Score between 0 and 1
 */
export function calculateDriverScore(metrics: DriverPerformanceInput): number {
  // Validate input
  const validatedMetrics = DriverPerformanceSchema.parse(metrics)
  
  const {
    acceptanceRate,
    cancellationRate,
    completionRate,
    feedbackScore,
    tripVolumeIndex,
    idleRatio
  } = validatedMetrics

  // Apply the weighted formula
  const score = 
    (acceptanceRate * 0.3) +                    // 30% weight
    ((1 - cancellationRate) * 0.2) +           // 20% weight (inverted)
    (completionRate * 0.15) +                  // 15% weight
    ((feedbackScore / 5) * 0.15) +             // 15% weight (normalized to 0-1)
    (tripVolumeIndex * 0.1) +                  // 10% weight
    ((1 - idleRatio) * 0.1)                    // 10% weight (inverted)

  // Ensure score is between 0 and 1
  return Math.max(0, Math.min(1, score))
}

/**
 * Get letter grade from score
 */
export function getGradeFromScore(score: number): string {
  if (score >= 0.95) return 'A+'
  if (score >= 0.9) return 'A'
  if (score >= 0.85) return 'B+'
  if (score >= 0.8) return 'B'
  if (score >= 0.75) return 'C+'
  if (score >= 0.7) return 'C'
  if (score >= 0.6) return 'D'
  return 'F'
}

/**
 * Get performance category from score
 */
export function getPerformanceCategory(score: number): 'excellent' | 'good' | 'average' | 'poor' | 'critical' {
  if (score >= 0.9) return 'excellent'
  if (score >= 0.8) return 'good'
  if (score >= 0.7) return 'average'
  if (score >= 0.6) return 'poor'
  return 'critical'
}

/**
 * Calculate score breakdown for analysis
 */
export function getScoreBreakdown(metrics: DriverPerformanceInput) {
  const validatedMetrics = DriverPerformanceSchema.parse(metrics)
  
  const {
    acceptanceRate,
    cancellationRate,
    completionRate,
    feedbackScore,
    tripVolumeIndex,
    idleRatio
  } = validatedMetrics

  const breakdown = {
    acceptance: {
      value: acceptanceRate,
      weight: 0.3,
      contribution: acceptanceRate * 0.3,
      label: 'Acceptance Rate'
    },
    cancellation: {
      value: 1 - cancellationRate,
      weight: 0.2,
      contribution: (1 - cancellationRate) * 0.2,
      label: 'Cancellation Rate (Inverted)'
    },
    completion: {
      value: completionRate,
      weight: 0.15,
      contribution: completionRate * 0.15,
      label: 'Completion Rate'
    },
    feedback: {
      value: feedbackScore / 5,
      weight: 0.15,
      contribution: (feedbackScore / 5) * 0.15,
      label: 'Feedback Score'
    },
    tripVolume: {
      value: tripVolumeIndex,
      weight: 0.1,
      contribution: tripVolumeIndex * 0.1,
      label: 'Trip Volume'
    },
    idle: {
      value: 1 - idleRatio,
      weight: 0.1,
      contribution: (1 - idleRatio) * 0.1,
      label: 'Idle Ratio (Inverted)'
    }
  }

  const totalScore = Object.values(breakdown).reduce((sum, metric) => sum + metric.contribution, 0)

  return {
    breakdown,
    totalScore: Math.max(0, Math.min(1, totalScore)),
    grade: getGradeFromScore(totalScore),
    category: getPerformanceCategory(totalScore)
  }
}

/**
 * Calculate driver score with detailed breakdown
 */
export function calculateDriverScoreDetailed(metrics: DriverMetrics): DriverScoreResult {
  const validatedMetrics = DriverMetricsSchema.parse(metrics)
  
  const {
    acceptanceRate,
    cancellationRate,
    completionRate,
    feedbackScore,
    tripVolumeIndex,
    idleRatio
  } = validatedMetrics

  // Calculate individual contributions
  const acceptanceContribution = acceptanceRate * 0.3
  const cancellationContribution = (1 - cancellationRate) * 0.2
  const completionContribution = completionRate * 0.15
  const feedbackContribution = (feedbackScore / 5) * 0.15
  const volumeContribution = tripVolumeIndex * 0.1
  const idleContribution = (1 - idleRatio) * 0.1

  const score = acceptanceContribution + cancellationContribution + 
                completionContribution + feedbackContribution + 
                volumeContribution + idleContribution

  const finalScore = Math.max(0, Math.min(1, score))

  return {
    score: finalScore,
    breakdown: {
      acceptanceContribution,
      cancellationContribution,
      completionContribution,
      feedbackContribution,
      volumeContribution,
      idleContribution,
    },
    grade: getGrade(finalScore),
    status: getStatus(finalScore),
  }
}

/**
 * Get letter grade based on score
 */
function getGrade(score: number): 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F' {
  if (score >= 0.97) return 'A+'
  if (score >= 0.90) return 'A'
  if (score >= 0.85) return 'B+'
  if (score >= 0.80) return 'B'
  if (score >= 0.75) return 'C+'
  if (score >= 0.70) return 'C'
  if (score >= 0.60) return 'D'
  return 'F'
}

/**
 * Get status based on score
 */
function getStatus(score: number): 'excellent' | 'good' | 'average' | 'poor' | 'critical' {
  if (score >= 0.90) return 'excellent'
  if (score >= 0.80) return 'good'
  if (score >= 0.70) return 'average'
  if (score >= 0.60) return 'poor'
  return 'critical'
}

/**
 * Check if driver needs alert based on score and criteria
 */
export function shouldAlertDriver(score: number, threshold: number = 0.6): boolean {
  return score < threshold
}

/**
 * Get alert priority based on score
 */
export function getAlertPriority(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score < 0.4) return 'critical'
  if (score < 0.5) return 'high'
  if (score < 0.6) return 'medium'
  return 'low'
} 