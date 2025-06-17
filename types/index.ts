import { z } from 'zod'

// Driver related schemas and types
export const DriverSchema = z.object({
  id: z.string().uuid(),
  uberDriverId: z.string(),
  name: z.string().min(1),
  phone: z.string().min(10),
  whatsappNumber: z.string().optional(),
  telegramUserId: z.string().optional(),
  email: z.string().email(),
  language: z.enum(['ENGLISH', 'ARABIC', 'HINDI', 'URDU', 'FRENCH', 'RUSSIAN', 'TAGALOG', 'SPANISH']),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
  joinedAt: z.date(),
  updatedAt: z.date(),
})

export type Driver = z.infer<typeof DriverSchema>

// Driver metrics and performance
export const DriverMetricsRecordSchema = z.object({
  id: z.string().uuid(),
  driverId: z.string().uuid(),
  date: z.date(),
  acceptanceRate: z.number().min(0).max(1),
  cancellationRate: z.number().min(0).max(1),
  completionRate: z.number().min(0).max(1),
  feedbackScore: z.number().min(0).max(5),
  tripVolumeIndex: z.number().min(0).max(1),
  idleRatio: z.number().min(0).max(1),
  calculatedScore: z.number().min(0).max(1),
  createdAt: z.date(),
})

export type DriverMetricsRecord = z.infer<typeof DriverMetricsRecordSchema>

// Alert related schemas
export const AlertTypeSchema = z.enum(['whatsapp', 'telegram', 'call', 'email'])
export const AlertStatusSchema = z.enum(['pending', 'sent', 'delivered', 'failed', 'read'])
export const AlertPrioritySchema = z.enum(['low', 'medium', 'high', 'critical'])

export const AlertRecordSchema = z.object({
  id: z.string().uuid(),
  driverId: z.string().uuid(),
  alertType: AlertTypeSchema,
  priority: AlertPrioritySchema,
  reason: z.string(),
  message: z.string(),
  status: AlertStatusSchema,
  sentAt: z.date().optional(),
  deliveredAt: z.date().optional(),
  readAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type AlertRecord = z.infer<typeof AlertRecordSchema>

// Alert rules and configuration
export const AlertRuleSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  isActive: z.boolean(),
  conditions: z.object({
    scoreThreshold: z.number().min(0).max(1).optional(),
    acceptanceRateThreshold: z.number().min(0).max(1).optional(),
    cancellationRateThreshold: z.number().min(0).max(1).optional(),
    completionRateThreshold: z.number().min(0).max(1).optional(),
    feedbackScoreThreshold: z.number().min(0).max(5).optional(),
    idleRatioThreshold: z.number().min(0).max(1).optional(),
  }),
  actions: z.array(z.object({
    type: AlertTypeSchema,
    delay: z.number().min(0), // delay in minutes
    template: z.string(),
  })),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type AlertRule = z.infer<typeof AlertRuleSchema>

// Uber API related types
export const UberTripSchema = z.object({
  trip_id: z.string(),
  driver_id: z.string(),
  status: z.enum(['requested', 'accepted', 'arrived', 'in_progress', 'completed', 'cancelled']),
  request_time: z.string(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  pickup_location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string().optional(),
  }),
  destination_location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string().optional(),
  }),
  fare: z.object({
    amount: z.number(),
    currency: z.string(),
  }).optional(),
  rating: z.number().min(1).max(5).optional(),
})

export type UberTrip = z.infer<typeof UberTripSchema>

export const UberDriverSchema = z.object({
  driver_id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
  phone_number: z.string(),
  status: z.enum(['online', 'offline', 'busy']),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
  vehicle: z.object({
    make: z.string(),
    model: z.string(),
    year: z.number(),
    license_plate: z.string(),
  }),
})

export type UberDriver = z.infer<typeof UberDriverSchema>

// Dashboard and analytics types
export const DashboardStatsSchema = z.object({
  totalDrivers: z.number(),
  activeDrivers: z.number(),
  averageScore: z.number(),
  alertsSentToday: z.number(),
  topPerformers: z.array(z.object({
    driverId: z.string(),
    name: z.string(),
    score: z.number(),
  })),
  underPerformers: z.array(z.object({
    driverId: z.string(),
    name: z.string(),
    score: z.number(),
    alertsPending: z.number(),
  })),
})

export type DashboardStats = z.infer<typeof DashboardStatsSchema>

// API Response types
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
  timestamp: z.date(),
})

export type ApiResponse<T = unknown> = {
  success: boolean
  data?: T
  error?: string
  timestamp: Date
}

// Pagination
export const PaginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  total: z.number().min(0),
  totalPages: z.number().min(0),
})

export type Pagination = z.infer<typeof PaginationSchema>

// Date range filters
export const DateRangeSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
})

export type DateRange = z.infer<typeof DateRangeSchema>

// Search and filter types
export const DriverFilterSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  scoreRange: z.object({
    min: z.number().min(0).max(1),
    max: z.number().min(0).max(1),
  }).optional(),
  dateRange: DateRangeSchema.optional(),
  search: z.string().optional(),
})

export type DriverFilter = z.infer<typeof DriverFilterSchema>

// Notification templates
export const NotificationTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: AlertTypeSchema,
  subject: z.string().optional(),
  content: z.string(),
  variables: z.array(z.string()),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type NotificationTemplate = z.infer<typeof NotificationTemplateSchema>

// System configuration
export const SystemConfigSchema = z.object({
  alerting: z.object({
    enabled: z.boolean(),
    defaultThreshold: z.number().min(0).max(1),
    maxAlertsPerDay: z.number().min(1),
    quietHours: z.object({
      start: z.string(), // HH:mm format
      end: z.string(),   // HH:mm format
    }),
  }),
  uber: z.object({
    apiKey: z.string(),
    webhookUrl: z.string(),
    syncInterval: z.number().min(5), // minutes
  }),
  communications: z.object({
    whatsapp: z.object({
      enabled: z.boolean(),
      apiKey: z.string().optional(),
      businessPhoneId: z.string().optional(),
    }),
    telegram: z.object({
      enabled: z.boolean(),
      botToken: z.string().optional(),
    }),
    voice: z.object({
      enabled: z.boolean(),
      twilioAccountSid: z.string().optional(),
      twilioAuthToken: z.string().optional(),
      fromNumber: z.string().optional(),
    }),
  }),
})

export type SystemConfig = z.infer<typeof SystemConfigSchema> 