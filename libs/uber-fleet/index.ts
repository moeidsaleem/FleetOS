import { z } from 'zod'

// Uber Fleet API Response Types
export const UberDriverSchema = z.object({
  driver_id: z.string(),
  profile: z.object({
    first_name: z.string(),
    last_name: z.string(),
    email: z.string().optional(),
    phone_number: z.string(),
    photo_url: z.string().optional(),
  }),
  status: z.enum(['active', 'inactive', 'suspended']),
  created_at: z.string(),
  updated_at: z.string(),
})

export const UberTripSchema = z.object({
  trip_id: z.string(),
  driver_id: z.string(),
  status: z.enum(['completed', 'cancelled', 'in_progress']),
  fare: z.object({
    amount: z.number(),
    currency: z.string(),
  }),
  rating: z.object({
    rider_rating: z.number().optional(),
  }).optional(),
  request_time: z.string(),
  pickup_time: z.string().optional(),
  dropoff_time: z.string().optional(),
})

export const UberMetricsSchema = z.object({
  driver_id: z.string(),
  date: z.string(),
  trips_completed: z.number(),
  trips_cancelled: z.number(),
  trips_requested: z.number(),
  acceptance_rate: z.number(),
  cancellation_rate: z.number(),
  completion_rate: z.number(),
  average_rating: z.number(),
  online_hours: z.number(),
  active_hours: z.number(),
})

export const UberDriverDetailsSchema = z.object({
  driver_id: z.string(),
  profile: z.object({
    first_name: z.string(),
    last_name: z.string(),
    email: z.string().optional(),
    phone_number: z.string(),
    photo_url: z.string().optional(),
  }),
  status: z.enum(['active', 'inactive', 'suspended']),
  created_at: z.string(),
  updated_at: z.string(),
})

export type UberDriver = z.infer<typeof UberDriverSchema>
export type UberTrip = z.infer<typeof UberTripSchema>
export type UberMetrics = z.infer<typeof UberMetricsSchema>
export type UberDriverDetails = z.infer<typeof UberDriverDetailsSchema>

export interface DriverPerformanceData {
  acceptanceRate: number
  cancellationRate: number
  completionRate: number
  feedbackScore: number
  tripVolumeIndex: number
  idleRatio: number
}

export interface DriverActivitySummary {
  driverId: string
  period: string
  metrics: DriverPerformanceData
  tripCount: number
  completedTrips: number
  cancelledTrips: number
  totalEarnings: number
  avgTripTime: number
  peakHours: number
  lastActivityDate: string | null
}

class UberFleetAPI {
  private baseURL: string
  private serverToken: string
  private organizationId: string
  private isConfigured: boolean

  constructor() {
    this.baseURL = process.env.UBER_BASE_URL || 'https://api.uber.com'
    this.serverToken = process.env.UBER_SERVER_TOKEN || ''
    this.organizationId = process.env.UBER_ORGANIZATION_ID || ''
    this.isConfigured = Boolean(this.serverToken && this.organizationId)
    
    if (!this.isConfigured) {
      console.log('⚠️  Uber Fleet API credentials not configured.')
      console.log('   Add UBER_SERVER_TOKEN and UBER_ORGANIZATION_ID to your .env file to connect to real Uber data.')
    } else {
      console.log('✅ Uber Fleet API configured successfully.')
    }
  }

  private async makeRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
    if (!this.isConfigured) {
      throw new Error('Uber Fleet API is not configured. Please add UBER_SERVER_TOKEN and UBER_ORGANIZATION_ID to your environment variables.')
    }

    const url = `${this.baseURL}/v1/organizations/${this.organizationId}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Token ${this.serverToken}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`Uber API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // Get all drivers
  async getDrivers(limit: number = 50, offset: number = 0): Promise<{ drivers: UberDriver[] }> {
    const response = await this.makeRequest<{ drivers: UberDriver[] }>(
      `/drivers?limit=${limit}&offset=${offset}`
    )
    return { drivers: UberDriverSchema.array().parse(response.drivers) }
  }

  // Get driver metrics for performance calculation
  async getDriverMetrics(driverId: string, startDate: string, endDate: string): Promise<UberMetrics> {
    const response = await this.makeRequest<UberMetrics>(
      `/drivers/${driverId}/metrics?start_date=${startDate}&end_date=${endDate}`
    )
    return UberMetricsSchema.parse(response)
  }

  // Get driver trips for detailed analysis
  async getDriverTrips(driverId: string, startDate: string, endDate: string): Promise<{ trips: UberTrip[] }> {
    const response = await this.makeRequest<{ trips: UberTrip[] }>(
      `/drivers/${driverId}/trips?start_date=${startDate}&end_date=${endDate}`
    )
    return { trips: UberTripSchema.array().parse(response.trips) }
  }

  // Get detailed driver information
  async getDriverDetails(driverId: string): Promise<UberDriverDetails> {
    const response = await this.makeRequest<UberDriverDetails>(
      `/drivers/${driverId}`
    )
    return UberDriverDetailsSchema.parse(response)
  }

  // Get driver's recent activity summary
  async getDriverActivity(driverId: string, days: number = 7): Promise<DriverActivitySummary> {
    const endDate = new Date().toISOString().split('T')[0]
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    const [metrics, { trips }] = await Promise.all([
      this.getDriverMetrics(driverId, startDate, endDate),
      this.getDriverTrips(driverId, startDate, endDate)
    ])

    const performanceData = this.calculatePerformanceData(metrics, trips)
    
    // Calculate additional activity metrics
    const totalEarnings = trips
      .filter(trip => trip.status === 'completed')
      .reduce((sum, trip) => sum + trip.fare.amount, 0)
    
    const avgTripTime = trips.length > 0 
      ? trips.reduce((sum, trip) => {
          if (trip.pickup_time && trip.dropoff_time) {
            const duration = new Date(trip.dropoff_time).getTime() - new Date(trip.pickup_time).getTime()
            return sum + duration
          }
          return sum
        }, 0) / trips.length / (1000 * 60) // Convert to minutes
      : 0

    const peakHours = this.calculatePeakHours(trips)
    
    return {
      driverId,
      period: `${days} days`,
      metrics: performanceData,
      tripCount: trips.length,
      completedTrips: trips.filter(trip => trip.status === 'completed').length,
      cancelledTrips: trips.filter(trip => trip.status === 'cancelled').length,
      totalEarnings,
      avgTripTime: Math.round(avgTripTime),
      peakHours,
      lastActivityDate: trips.length > 0 ? trips[0].request_time : null
    }
  }

  // Calculate performance data from Uber metrics
  calculatePerformanceData(metrics: UberMetrics, trips: UberTrip[]): DriverPerformanceData {
    const acceptanceRate = metrics.acceptance_rate / 100
    const cancellationRate = metrics.cancellation_rate / 100
    const completionRate = metrics.completion_rate / 100
    
    // Calculate average rating from trips
    const ratingsOnly = trips
      .map(trip => trip.rating?.rider_rating)
      .filter((rating): rating is number => rating !== undefined)
    const feedbackScore = ratingsOnly.length > 0 
      ? ratingsOnly.reduce((sum, rating) => sum + rating, 0) / ratingsOnly.length
      : 4.0 // Default rating if no ratings available

    // Calculate trip volume index (normalized to 0-1 based on typical range)
    const tripVolumeIndex = Math.min(metrics.trips_completed / 100, 1) // Normalize to max 100 trips

    // Calculate idle ratio (time offline vs online)
    const idleRatio = metrics.online_hours > 0 
      ? Math.max(0, (metrics.online_hours - metrics.active_hours) / metrics.online_hours)
      : 0.2 // Default 20% idle time

    return {
      acceptanceRate,
      cancellationRate,
      completionRate,
      feedbackScore,
      tripVolumeIndex,
      idleRatio,
    }
  }

  private calculatePeakHours(trips: UberTrip[]): number {
    if (trips.length === 0) return 0
    
    // Count trips by hour of day
    const hourCounts: Record<number, number> = {}
    
    trips.forEach(trip => {
      if (trip.request_time) {
        const hour = new Date(trip.request_time).getHours()
        hourCounts[hour] = (hourCounts[hour] || 0) + 1
      }
    })
    
    // Find peak hours (hours with above average trip count)
    const totalTrips = Object.values(hourCounts).reduce((sum, count) => sum + count, 0)
    const avgTripsPerHour = totalTrips / 24
    
    return Object.values(hourCounts).filter(count => count > avgTripsPerHour).length
  }

  // Check if API is properly configured
  isAPIConfigured(): boolean {
    return this.isConfigured
  }
}

export const uberFleetAPI = new UberFleetAPI() 