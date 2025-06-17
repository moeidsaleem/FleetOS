import twilio from 'twilio'

export interface VoiceCallOptions {
  to: string
  message: string
  voice?: 'man' | 'woman' | 'alice'
  language?: string
  loop?: number
}

export class VoiceService {
  private client: twilio.Twilio
  private fromNumber: string

  constructor(accountSid: string, authToken: string, fromNumber: string) {
    this.client = twilio(accountSid, authToken)
    this.fromNumber = fromNumber
  }

  /**
   * Make a voice call with a custom message
   */
  async makeCall(to: string, message: string, voice: 'man' | 'woman' | 'alice' = 'alice'): Promise<boolean> {
    try {
      const twiml = this.createTwiML(message, voice)
      
      const call = await this.client.calls.create({
        to: this.formatPhoneNumber(to),
        from: this.fromNumber,
        twiml: twiml,
        timeout: 30, // 30 seconds timeout
        record: false
      })

      console.log('✅ Voice call initiated:', call.sid)
      return true
    } catch (error) {
      console.error('❌ Voice call failed:', error)
      return false
    }
  }

  /**
   * Make a driver alert call
   */
  async makeDriverAlertCall(to: string, driverName: string, score: number, reason: string): Promise<boolean> {
    const message = `Hello ${driverName}. This is an important message from Mr. Nice Drive limousine service. 
    Your current performance score is ${(score * 100).toFixed(0)} percent, which is below our standards. 
    The specific issue is: ${reason}. 
    Please contact management immediately at your earliest convenience to discuss this matter. 
    Thank you.`

    return await this.makeCall(to, message)
  }

  /**
   * Make a critical alert call
   */
  async makeCriticalAlertCall(to: string, driverName: string, issue: string): Promise<boolean> {
    const message = `URGENT MESSAGE for ${driverName} from Mr. Nice Drive limousine service. 
    We have detected a critical issue: ${issue}. 
    This requires your immediate attention. 
    Please contact management RIGHT NOW. 
    This is urgent. Thank you.`

    return await this.makeCall(to, message)
  }

  /**
   * Make a reminder call
   */
  async makeReminderCall(to: string, driverName: string, reminder: string): Promise<boolean> {
    const message = `Hello ${driverName}. This is a friendly reminder from Mr. Nice Drive. 
    ${reminder}. 
    If you have any questions, please contact management. 
    Thank you and have a great day.`

    return await this.makeCall(to, message)
  }

  /**
   * Get call status
   */
  async getCallStatus(callSid: string) {
    try {
      const call = await this.client.calls(callSid).fetch()
      return {
        status: call.status,
        duration: call.duration,
        startTime: call.startTime,
        endTime: call.endTime,
        price: call.price,
        priceUnit: call.priceUnit
      }
    } catch (error) {
      console.error('Failed to get call status:', error)
      throw new Error(`Failed to get status for call ${callSid}`)
    }
  }

  /**
   * List recent calls
   */
  async getRecentCalls(limit: number = 20) {
    try {
      const calls = await this.client.calls.list({
        limit: limit,
        pageSize: limit
      })

      return calls.map(call => ({
        sid: call.sid,
        to: call.to,
        from: call.from,
        status: call.status,
        startTime: call.startTime,
        endTime: call.endTime,
        duration: call.duration,
        price: call.price
      }))
    } catch (error) {
      console.error('Failed to get recent calls:', error)
      throw new Error('Failed to fetch recent calls')
    }
  }

  /**
   * Create TwiML for voice message
   */
  private createTwiML(message: string, voice: string = 'alice'): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="${voice}" language="en-US">${this.escapeXML(message)}</Say>
    <Pause length="1"/>
    <Say voice="${voice}" language="en-US">This message will now repeat.</Say>
    <Pause length="1"/>
    <Say voice="${voice}" language="en-US">${this.escapeXML(message)}</Say>
</Response>`
  }

  /**
   * Format phone number for Twilio
   */
  private formatPhoneNumber(phone: string): string {
    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, '')
    
    // Add country code if not present (assuming UAE +971)
    if (!cleaned.startsWith('971') && !cleaned.startsWith('+971')) {
      return `+971${cleaned}`
    }
    
    return cleaned.startsWith('+') ? cleaned : `+${cleaned}`
  }

  /**
   * Escape XML special characters
   */
  private escapeXML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }
}

// Singleton instance
let voiceService: VoiceService | null = null

export function getVoiceService(): VoiceService {
  if (!voiceService) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const fromNumber = process.env.TWILIO_FROM_NUMBER
    
    if (!accountSid || !authToken || !fromNumber) {
      throw new Error('Twilio credentials not configured')
    }
    
    voiceService = new VoiceService(accountSid, authToken, fromNumber)
  }
  
  return voiceService
}

export function setVoiceService(accountSid: string, authToken: string, fromNumber: string): VoiceService {
  voiceService = new VoiceService(accountSid, authToken, fromNumber)
  return voiceService
} 