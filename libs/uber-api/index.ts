import axios, { AxiosInstance } from 'axios'

// --- Token Manager ---
let uberAccessToken: string | null = null
let tokenExpiresAt: number | null = null

// --- Hardcoded Uber API credentials for local development ---
const HARDCODED_UBER_CLIENT_ID = 'U2idaei66oBs3ajbKWN_nGICWMpEax7b'
const HARDCODED_UBER_CLIENT_SECRET = 'ErNQd332qGCEhI3vjBPSLP9gkEozJWfHGWGxLMmD'
const HARDCODED_UBER_SCOPE = "solutions.suppliers.drivers.status.read solutions.suppliers.reports supplier.partner.payments vehicle_suppliers.vehicles.read vehicle_suppliers.vehicles.write solutions.suppliers.metrics.read vehicle_suppliers.organizations.read"
const HARDCODED_UBER_ORG_ID = "8Ecn5uogQt_k3ii01cAnN7JgsMktSs5Nywf-7UGnopC67mwxp1J0JXGG-NK9JTPcleWYaKOfxFvX6ZJydPM-HihAhU8hpkdzyYvrfrQkkjOGmzZOt9dyZ1HtPO-UbykipQ=="

async function fetchUberAccessToken(): Promise<string> {
  // Use hardcoded values for local/dev
  const clientId = HARDCODED_UBER_CLIENT_ID
  const clientSecret = HARDCODED_UBER_CLIENT_SECRET
  const scope = HARDCODED_UBER_SCOPE
  if (!clientId || !clientSecret || !scope) {
    throw new Error('UBER_CLIENT_ID, UBER_CLIENT_SECRET, and UBER_SCOPE must be set in environment variables')
  }
  const params = new URLSearchParams()
  params.append('client_id', clientId)
  params.append('client_secret', clientSecret)
  params.append('grant_type', 'client_credentials')
  params.append('scope', scope)

  const response = await axios.post('https://auth.uber.com/oauth/v2/token', params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })
  uberAccessToken = response.data.access_token
  // expires_in is in seconds
  tokenExpiresAt = Date.now() + (response.data.expires_in - 60) * 1000 // refresh 1 min early
  return uberAccessToken!
}

async function getUberAccessToken(): Promise<string> {
  if (!uberAccessToken || !tokenExpiresAt || Date.now() > tokenExpiresAt) {
    return fetchUberAccessToken()
  }
  return uberAccessToken
}

export class UberFleetAPI {
  private baseURL: string

  constructor(baseURL = 'https://api.uber.com/v1') {
    this.baseURL = baseURL
  }

  private async getClient(): Promise<AxiosInstance> {
    const token = await getUberAccessToken()
    return axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    })
  }

  // --- Uber Vehicle Suppliers Endpoints ---

  /**
   * List drivers (vehicle-suppliers)
   */
  async listDrivers(orgId?: string): Promise<any[]> {
    const client = await this.getClient()
    // Use hardcoded org ID if not provided
    const response = await client.get(`/vehicle-suppliers/drivers`, {
      params: { org_id: orgId || HARDCODED_UBER_ORG_ID },
    })
    // Uber API returns driverInformation array
    return response.data.driverInformation || []
  }

  /**
   * Get driver details (vehicle-suppliers)
   */
  async getDriver(driverId: string): Promise<any> {
    const client = await this.getClient()
    // Use hardcoded org ID
    const orgId = HARDCODED_UBER_ORG_ID
    if (!orgId) throw new Error('UBER_ORG_ID must be set in env')
    const response = await client.get(`/vehicle-suppliers/drivers/${driverId}`, {
      params: { org_id: orgId },
    })
    console.log('Uber API getDriver response:', response.data)
    return response.data
  }

  /**
   * Analytics data query (performance reports)
   */
  async analyticsDataQuery(body: any): Promise<any> {
    const client = await this.getClient()
    const response = await client.post(`/vehicle-suppliers/analytics-data/query`, body)
    console.log('Uber API analyticsDataQuery response:', response.data)
    return response.data
  }

  /**
   * List trips for a specific driver (vehicle-suppliers)
   */
  async listTripsForDriver(driverUuid: string, orgId?: string, params: Record<string, any> = {}): Promise<any> {
    const client = await this.getClient()
    // Use hardcoded org ID if not provided
    const response = await client.get(`/vehicle-suppliers/drivers/${driverUuid}/trips`, {
      params: { org_id: orgId || HARDCODED_UBER_ORG_ID, ...params },
    })
    console.log('Uber API listTripsForDriver response:', response.data)
    return response.data
  }

  /**
   * Get trips for a specific driver (vehicle-suppliers)
   */
  async getTripsForDriver(driverUuid: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    // Use hardcoded org ID
    const orgId = HARDCODED_UBER_ORG_ID
    if (!orgId) throw new Error('UBER_ORG_ID must be set in env')
    const params: Record<string, any> = {}
    if (startDate) params.start_time = startDate.toISOString()
    if (endDate) params.end_time = endDate.toISOString()
    const data = await this.listTripsForDriver(driverUuid, orgId, params)
    return data.trips || data
  }

  /**
   * Calculate driver metrics from trips array
   */
  calculateDriverMetricsFromTrips(driverId: string, trips: any[]): any {
    if (!trips || trips.length === 0) {
      // Return zeros if no trips
      return {
        acceptanceRate: 0,
        cancellationRate: 0,
        completionRate: 0,
        feedbackScore: 0,
        tripVolumeIndex: 0,
        idleRatio: 1,
      }
    }
    // Acceptance: accepted / (accepted + rejected)
    const accepted = trips.filter(t => t.status === 'accepted').length
    const rejected = trips.filter(t => t.status === 'rejected').length
    const acceptanceRate = (accepted + rejected) > 0 ? accepted / (accepted + rejected) : 0
    // Cancellation: cancelled / total
    const cancelled = trips.filter(t => t.status === 'cancelled').length
    const cancellationRate = trips.length > 0 ? cancelled / trips.length : 0
    // Completion: completed / total
    const completed = trips.filter(t => t.status === 'completed').length
    const completionRate = trips.length > 0 ? completed / trips.length : 0
    // Feedback: average rating
    const feedbacks = trips.map(t => t.feedback_rating).filter(r => typeof r === 'number')
    const feedbackScore = feedbacks.length > 0 ? feedbacks.reduce((a, b) => a + b, 0) / feedbacks.length : 0
    // Trip volume index: relative to 20 trips as a baseline
    const tripVolumeIndex = Math.min(1, trips.length / 20)
    // Idle ratio: if available, use Uber's online/idle time, else default to 1-idle
    // (This is a placeholder, as Uber API may not provide this directly)
    const idleRatio = 0.5 // Placeholder
    return {
      acceptanceRate,
      cancellationRate,
      completionRate,
      feedbackScore,
      tripVolumeIndex,
      idleRatio,
    }
  }

  /**
   * Get driver status overviews (vehicle-suppliers/drivers/actions)
   */
  async getDriverStatusOverviews(orgId?: string, pageSize: number = 100): Promise<any[]> {
    const client = await this.getClient()
    const response = await client.get(`/vehicle-suppliers/drivers/actions`, {
      params: {
        org_id: orgId || HARDCODED_UBER_ORG_ID,
        page_size: pageSize,
      },
    })
    console.log('Uber API getDriverStatusOverviews response:', response.data)
    return response.data.driverStatusOverviews || []
  }

  // --- Deprecated/legacy methods (do not use for new code) ---

  /**
   * Deprecated: Use listTrips or analyticsDataQuery for trip/metrics data
   */
  async getDriverTrips(): Promise<any[]> {
    // Deprecated placeholder
    return []
  }

  /**
   * Deprecated: Use analyticsDataQuery for metrics
   */
  async getDriverMetrics(): Promise<any> {
    // Deprecated placeholder
    return {}
  }

  /**
   * Deprecated: Use listTrips for all trips
   */
  async getTrips(startDate?: Date, endDate?: Date): Promise<any[]> {
    const orgId = process.env.UBER_ORG_ID
    if (!orgId) throw new Error('UBER_ORG_ID must be set in env')

    const drivers = await this.listDrivers(orgId)
    if (!drivers || drivers.length === 0) {
      return []
    }

    const params: Record<string, any> = {}
    if (startDate) params.start_time = startDate.toISOString()
    if (endDate) params.end_time = endDate.toISOString()

    const allTrips: any[] = []

    const tripPromises = drivers.map(driver => {
      // Assuming the driver object has a 'driverUuid' property
      if (driver.driverUuid) {
        return this.listTripsForDriver(driver.driverUuid, orgId, params)
          .then(data => (data.trips && Array.isArray(data.trips) ? data.trips : []))
          .catch(err => {
            console.error(
              `Failed to fetch trips for driver ${driver.driverUuid}:`,
              err.message
            )
            return [] // Return empty array on error for a specific driver
          })
      }
      return Promise.resolve([])
    })

    const tripsArrays = await Promise.all(tripPromises)
    tripsArrays.forEach(trips => {
      if (Array.isArray(trips)) {
        allTrips.push(...trips)
      }
    })

    return allTrips
  }
}

// Singleton instance
let uberAPI: UberFleetAPI | null = null

export function getUberAPI(): UberFleetAPI {
  if (!uberAPI) {
    uberAPI = new UberFleetAPI()
  }
  return uberAPI
}

export function setUberAPI(baseURL?: string): UberFleetAPI {
  uberAPI = new UberFleetAPI(baseURL)
  return uberAPI
} 