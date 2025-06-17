import axios, { AxiosInstance } from 'axios'

export interface WhatsAppMessage {
  to: string
  message: string
  template?: string
  variables?: string[]
}

export class WhatsAppService {
  private client: AxiosInstance
  private accessToken: string
  private businessPhoneId: string
  private baseURL: string

  constructor(accessToken: string, businessPhoneId: string) {
    this.accessToken = accessToken
    this.businessPhoneId = businessPhoneId
    this.baseURL = `https://graph.facebook.com/v18.0/${businessPhoneId}`

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    })
  }

  /**
   * Send a simple text message
   */
  async sendMessage(to: string, message: string): Promise<boolean> {
    try {
      const response = await this.client.post('/messages', {
        messaging_product: 'whatsapp',
        to: this.formatPhoneNumber(to),
        type: 'text',
        text: {
          body: message
        }
      })

      console.log('✅ WhatsApp message sent:', response.data)
      return true
    } catch (error) {
      console.error('❌ WhatsApp message failed:', error)
      return false
    }
  }

  /**
   * Send a template message (for business notifications)
   */
  async sendTemplate(
    to: string, 
    templateName: string, 
    languageCode: string = 'en',
    parameters?: Array<{ type: 'text', text: string }>
  ): Promise<boolean> {
    try {
      const templateData: any = {
        messaging_product: 'whatsapp',
        to: this.formatPhoneNumber(to),
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: languageCode
          }
        }
      }

      if (parameters && parameters.length > 0) {
        templateData.template.components = [
          {
            type: 'body',
            parameters: parameters
          }
        ]
      }

      const response = await this.client.post('/messages', templateData)
      console.log('✅ WhatsApp template sent:', response.data)
      return true
    } catch (error) {
      console.error('❌ WhatsApp template failed:', error)
      return false
    }
  }

  /**
   * Send driver performance alert
   */
  async sendDriverAlert(to: string, driverName: string, score: number, reason: string): Promise<boolean> {
    const grade = this.getGrade(score)
    const emoji = this.getGradeEmoji(grade)
    
    const message = `🚗 *Mr. Nice Drive - Driver Alert*

Hello ${driverName},

${emoji} Your current performance score is *${(score * 100).toFixed(1)}%* (Grade: ${grade})

⚠️ *Issue:* ${reason}

Please review your performance and contact management if you need assistance.

*Next Steps:*
• Review your recent trips
• Check for any issues
• Contact support: +971-XX-XXXXXXX

Thank you for being part of Mr. Nice Drive!`

    return await this.sendMessage(to, message)
  }

  /**
   * Send daily performance summary
   */
  async sendDailyReport(to: string, driverName: string, metrics: any): Promise<boolean> {
    const message = `📊 *Daily Performance Report - ${driverName}*

🎯 *Today's Score:* ${(metrics.score * 100).toFixed(1)}% (${this.getGrade(metrics.score)})

📈 *Metrics:*
• Acceptance Rate: ${(metrics.acceptanceRate * 100).toFixed(1)}%
• Completion Rate: ${(metrics.completionRate * 100).toFixed(1)}%
• Customer Rating: ${metrics.feedbackScore.toFixed(1)}/5.0 ⭐
• Trips Completed: ${metrics.tripsCompleted}

Keep up the excellent work! 🚀`

    return await this.sendMessage(to, message)
  }

  /**
   * Format phone number to international format
   */
  private formatPhoneNumber(phone: string): string {
    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, '')
    
    // Add country code if not present (assuming UAE +971)
    if (!cleaned.startsWith('971') && !cleaned.startsWith('+971')) {
      return `971${cleaned}`
    }
    
    return cleaned.startsWith('+') ? cleaned.substring(1) : cleaned
  }

  /**
   * Get letter grade from score
   */
  private getGrade(score: number): string {
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
   * Get emoji for grade
   */
  private getGradeEmoji(grade: string): string {
    const emojiMap: Record<string, string> = {
      'A+': '🏆',
      'A': '🥇',
      'B+': '🥈',
      'B': '👍',
      'C+': '⚠️',
      'C': '⚠️',
      'D': '🔴',
      'F': '🚨'
    }
    return emojiMap[grade] || '📊'
  }
}

// Singleton instance
let whatsappService: WhatsAppService | null = null

export function getWhatsAppService(): WhatsAppService {
  if (!whatsappService) {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
    const businessPhoneId = process.env.WHATSAPP_BUSINESS_PHONE_ID
    
    if (!accessToken || !businessPhoneId) {
      throw new Error('WhatsApp credentials not configured')
    }
    
    whatsappService = new WhatsAppService(accessToken, businessPhoneId)
  }
  
  return whatsappService
}

export function setWhatsAppService(accessToken: string, businessPhoneId: string): WhatsAppService {
  whatsappService = new WhatsAppService(accessToken, businessPhoneId)
  return whatsappService
} 