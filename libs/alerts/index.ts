import { prisma } from '../database'
import { getWhatsAppService } from './whatsapp'
import { getTelegramService } from './telegram'
import { getVoiceService } from './voice'
import { getAlertPriority } from '../driver-scoring'
import { AlertTypeSchema, AlertPrioritySchema } from '../../types'
import { z } from 'zod'

type AlertType = z.infer<typeof AlertTypeSchema>
type AlertPriority = z.infer<typeof AlertPrioritySchema>

export interface AlertRequest {
  driverId: string
  reason: string
  priority?: AlertPriority
  channels?: AlertType[]
  customMessage?: string
}

export interface AlertResult {
  success: boolean
  alertId: string
  channelResults: {
    [key in AlertType]?: boolean
  }
  error?: string
}

export class AlertOrchestrator {
  /**
   * Send alert to driver based on their performance
   */
  async sendDriverAlert(request: AlertRequest): Promise<AlertResult> {
    try {
      // Get driver information
      const driver = await prisma.driver.findUnique({
        where: { id: request.driverId },
        include: {
          metrics: {
            orderBy: { date: 'desc' },
            take: 1
          }
        }
      })

      if (!driver) {
        throw new Error(`Driver ${request.driverId} not found`)
      }

      const latestMetrics = driver.metrics[0]
      if (!latestMetrics) {
        throw new Error(`No metrics found for driver ${request.driverId}`)
      }

      // Determine alert priority if not provided
      const priority = request.priority || getAlertPriority(latestMetrics.calculatedScore)
      
      // Determine channels if not provided
      const channels = request.channels || this.getDefaultChannels(priority)

      // Create alert record - map to Prisma enum values
      const alertRecord = await prisma.alertRecord.create({
        data: {
          driverId: request.driverId,
          alertType: this.mapToPrismaAlertType(channels[0]), // Primary channel
          priority: this.mapToPrismaPriority(priority),
          reason: request.reason,
          message: request.customMessage || this.generateMessage(driver.name, latestMetrics.calculatedScore, request.reason),
          status: 'PENDING'
        }
      })

      // Send alerts through each channel
      const channelResults: { [key in AlertType]?: boolean } = {}
      
      for (const channel of channels) {
        let success = false
        
        try {
          switch (channel) {
            case 'whatsapp':
              success = await this.sendWhatsAppAlert(driver, latestMetrics.calculatedScore, request.reason)
              break
            case 'telegram':
              success = await this.sendTelegramAlert(driver, latestMetrics.calculatedScore, request.reason)
              break
            case 'call':
              success = await this.sendVoiceAlert(driver, latestMetrics.calculatedScore, request.reason, priority)
              break
            case 'email':
              // TODO: Implement email service
              success = false
              break
          }
          
          channelResults[channel] = success
        } catch (error) {
          console.error(`Failed to send ${channel} alert:`, error)
          channelResults[channel] = false
        }
      }

      // Update alert record with results
      const overallSuccess = Object.values(channelResults).some(result => result === true)
      
      await prisma.alertRecord.update({
        where: { id: alertRecord.id },
        data: {
          status: overallSuccess ? 'SENT' : 'FAILED',
          sentAt: overallSuccess ? new Date() : undefined
        }
      })

      return {
        success: overallSuccess,
        alertId: alertRecord.id,
        channelResults
      }
      
    } catch (error) {
      console.error('Alert orchestrator error:', error)
      return {
        success: false,
        alertId: '',
        channelResults: {},
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Send bulk alerts to multiple drivers
   */
  async sendBulkAlerts(requests: AlertRequest[]): Promise<AlertResult[]> {
    const results: AlertResult[] = []
    
    for (const request of requests) {
      const result = await this.sendDriverAlert(request)
      results.push(result)
      
      // Add delay between alerts to avoid rate limiting
      await this.delay(1000) // 1 second delay
    }
    
    return results
  }

  /**
   * Check and send automatic alerts based on rules
   */
  async processAutomaticAlerts(): Promise<void> {
    try {
      console.log('🔍 Processing automatic alerts...')
      
      // Get active alert rules
      const alertRules = await prisma.alertRule.findMany({
        where: { isActive: true }
      })

      // Get drivers with recent metrics
      const driversWithMetrics = await prisma.driver.findMany({
        where: { status: 'ACTIVE' },
        include: {
          metrics: {
            orderBy: { date: 'desc' },
            take: 1
          },
          alerts: {
            where: {
              createdAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
              }
            }
          }
        }
      })

      for (const driver of driversWithMetrics) {
        const latestMetrics = driver.metrics[0]
        if (!latestMetrics) continue

        // Check each rule
        for (const rule of alertRules) {
          const conditions = rule.conditions as Record<string, unknown>
          const actions = rule.actions as Array<{ type: AlertType }>
          
          if (this.evaluateRuleConditions(latestMetrics, conditions)) {
            // Check if we've already sent an alert recently
            const recentAlert = driver.alerts.find((alert: { reason: string; createdAt: Date }) => 
              alert.reason.includes(rule.name) && 
              alert.createdAt > new Date(Date.now() - 4 * 60 * 60 * 1000) // Last 4 hours
            )
            
            if (!recentAlert) {
              await this.sendDriverAlert({
                driverId: driver.id,
                reason: `Automatic alert: ${rule.description}`,
                priority: this.mapRulePriority(conditions),
                channels: actions.map(action => action.type)
              })
              
              console.log(`📨 Automatic alert sent to ${driver.name} (Rule: ${rule.name})`)
            }
          }
        }
      }
      
      console.log('✅ Automatic alerts processing completed')
    } catch (error) {
      console.error('❌ Error processing automatic alerts:', error)
    }
  }

  /**
   * Send WhatsApp alert
   */
  private async sendWhatsAppAlert(driver: Record<string, unknown>, score: number, reason: string): Promise<boolean> {
    if (!driver.whatsappNumber) {
      console.log(`No WhatsApp number for driver ${driver.name}`)
      return false
    }
    
    try {
      const whatsappService = getWhatsAppService()
      return await whatsappService.sendDriverAlert(
        driver.whatsappNumber as string, 
        driver.name as string, 
        score, 
        reason
      )
    } catch {
      console.error('WhatsApp service not configured')
      return false
    }
  }

  /**
   * Send Telegram alert
   */
  private async sendTelegramAlert(driver: Record<string, unknown>, score: number, reason: string): Promise<boolean> {
    if (!driver.telegramUserId) {
      console.log(`No Telegram ID for driver ${driver.name}`)
      return false
    }
    
    try {
      const telegramService = getTelegramService()
      return await telegramService.sendDriverAlert(
        driver.telegramUserId as string, 
        driver.name as string, 
        score, 
        reason
      )
    } catch {
      console.error('Telegram service not configured')
      return false
    }
  }

  /**
   * Send voice alert
   */
  private async sendVoiceAlert(driver: Record<string, unknown>, score: number, reason: string, priority: AlertPriority): Promise<boolean> {
    try {
      const voiceService = getVoiceService()
      
      if (priority === 'critical') {
        return await voiceService.makeCriticalAlertCall(
          driver.phone as string, 
          driver.name as string, 
          reason
        )
      } else {
        return await voiceService.makeDriverAlertCall(
          driver.phone as string, 
          driver.name as string, 
          score, 
          reason
        )
      }
    } catch {
      console.error('Voice service not configured')
      return false
    }
  }

  /**
   * Get default channels based on priority
   */
  private getDefaultChannels(priority: AlertPriority): AlertType[] {
    switch (priority) {
      case 'critical':
        return ['call', 'whatsapp', 'telegram']
      case 'high':
        return ['whatsapp', 'telegram']
      case 'medium':
        return ['whatsapp']
      case 'low':
        return ['whatsapp']
      default:
        return ['whatsapp']
    }
  }

  /**
   * Map Zod types to Prisma enum values
   */
  private mapToPrismaAlertType(type: AlertType): 'WHATSAPP' | 'TELEGRAM' | 'CALL' | 'EMAIL' {
    const mapping = {
      'whatsapp': 'WHATSAPP' as const,
      'telegram': 'TELEGRAM' as const,
      'call': 'CALL' as const,
      'email': 'EMAIL' as const,
    }
    return mapping[type]
  }

  private mapToPrismaPriority(priority: AlertPriority): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const mapping = {
      'low': 'LOW' as const,
      'medium': 'MEDIUM' as const,
      'high': 'HIGH' as const,
      'critical': 'CRITICAL' as const,
    }
    return mapping[priority]
  }

  /**
   * Generate alert message
   */
  private generateMessage(driverName: string, score: number, reason: string): string {
    return `Performance Alert for ${driverName}: Score ${(score * 100).toFixed(1)}% - ${reason}`
  }

  /**
   * Evaluate rule conditions
   */
  private evaluateRuleConditions(metrics: Record<string, unknown>, conditions: Record<string, unknown>): boolean {
    if (conditions.scoreThreshold && (metrics.calculatedScore as number) < (conditions.scoreThreshold as number)) {
      return true
    }
    
    if (conditions.acceptanceRateThreshold && (metrics.acceptanceRate as number) < (conditions.acceptanceRateThreshold as number)) {
      return true
    }
    
    if (conditions.cancellationRateThreshold && (metrics.cancellationRate as number) > (conditions.cancellationRateThreshold as number)) {
      return true
    }
    
    if (conditions.completionRateThreshold && (metrics.completionRate as number) < (conditions.completionRateThreshold as number)) {
      return true
    }
    
    if (conditions.feedbackScoreThreshold && (metrics.feedbackScore as number) < (conditions.feedbackScoreThreshold as number)) {
      return true
    }
    
    if (conditions.idleRatioThreshold && (metrics.idleRatio as number) > (conditions.idleRatioThreshold as number)) {
      return true
    }
    
    return false
  }

  /**
   * Map rule conditions to alert priority
   */
  private mapRulePriority(conditions: Record<string, unknown>): AlertPriority {
    if (conditions.scoreThreshold && (conditions.scoreThreshold as number) < 0.4) {
      return 'critical'
    } else if (conditions.scoreThreshold && (conditions.scoreThreshold as number) < 0.6) {
      return 'high'
    } else {
      return 'medium'
    }
  }

  /**
   * Add delay for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Singleton instance
export const alertOrchestrator = new AlertOrchestrator()

// Export convenience functions
export async function sendDriverAlert(request: AlertRequest): Promise<AlertResult> {
  return alertOrchestrator.sendDriverAlert(request)
}

export async function sendBulkAlerts(requests: AlertRequest[]): Promise<AlertResult[]> {
  return alertOrchestrator.sendBulkAlerts(requests)
}

export async function processAutomaticAlerts(): Promise<void> {
  return alertOrchestrator.processAutomaticAlerts()
} 