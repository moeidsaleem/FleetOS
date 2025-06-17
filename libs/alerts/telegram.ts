import axios, { AxiosInstance } from 'axios'

export interface TelegramMessage {
  chatId: string
  text: string
  parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2'
  disableWebPagePreview?: boolean
}

export class TelegramService {
  private client: AxiosInstance
  private botToken: string
  private baseURL: string

  constructor(botToken: string) {
    this.botToken = botToken
    this.baseURL = `https://api.telegram.org/bot${botToken}`

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 15000,
    })
  }

  /**
   * Send a simple text message
   */
  async sendMessage(chatId: string, text: string, parseMode: 'HTML' | 'Markdown' | 'MarkdownV2' = 'Markdown'): Promise<boolean> {
    try {
      const response = await this.client.post('/sendMessage', {
        chat_id: chatId,
        text: text,
        parse_mode: parseMode,
        disable_web_page_preview: true
      })

      console.log('✅ Telegram message sent:', response.data.ok)
      return response.data.ok
    } catch (error) {
      console.error('❌ Telegram message failed:', error)
      return false
    }
  }

  /**
   * Send driver performance alert
   */
  async sendDriverAlert(chatId: string, driverName: string, score: number, reason: string): Promise<boolean> {
    const grade = this.getGrade(score)
    const emoji = this.getGradeEmoji(grade)
    
    const message = `🚗 *Mr\\. Nice Drive \\- Driver Alert*

Hello *${this.escapeMarkdown(driverName)}*,

${emoji} Your current performance score is *${(score * 100).toFixed(1)}%* \\(Grade: ${grade}\\)

⚠️ *Issue:* ${this.escapeMarkdown(reason)}

Please review your performance and contact management if you need assistance\\.

*Next Steps:*
• Review your recent trips
• Check for any issues  
• Contact support: \\+971\\-XX\\-XXXXXXX

Thank you for being part of Mr\\. Nice Drive\\!`

    return await this.sendMessage(chatId, message, 'MarkdownV2')
  }

  /**
   * Send daily performance summary
   */
  async sendDailyReport(chatId: string, driverName: string, metrics: {
    score: number
    acceptanceRate: number
    completionRate: number
    feedbackScore: number
    tripsCompleted: number
  }): Promise<boolean> {
    const message = `📊 *Daily Performance Report \\- ${this.escapeMarkdown(driverName)}*

🎯 *Today's Score:* ${(metrics.score * 100).toFixed(1)}% \\(${this.getGrade(metrics.score)}\\)

📈 *Metrics:*
• Acceptance Rate: ${(metrics.acceptanceRate * 100).toFixed(1)}%
• Completion Rate: ${(metrics.completionRate * 100).toFixed(1)}%
• Customer Rating: ${metrics.feedbackScore.toFixed(1)}/5\\.0 ⭐
• Trips Completed: ${metrics.tripsCompleted}

Keep up the excellent work\\! 🚀`

    return await this.sendMessage(chatId, message, 'MarkdownV2')
  }

  /**
   * Send weekly summary
   */
  async sendWeeklySummary(chatId: string, driverName: string, weeklyStats: {
    weekEnding: string
    averageScore: number
    trend: number
    totalTrips: number
    bestDay: string
    bestScore: number
    averageRating: number
    achievement?: string
  }): Promise<boolean> {
    const message = `📊 *Weekly Performance Summary \\- ${this.escapeMarkdown(driverName)}*

📅 *Week Ending:* ${weeklyStats.weekEnding}

🎯 *Average Score:* ${(weeklyStats.averageScore * 100).toFixed(1)}%
📈 *Trend:* ${weeklyStats.trend > 0 ? '📈 Improving' : weeklyStats.trend < 0 ? '📉 Declining' : '➡️ Stable'}

*Weekly Highlights:*
• Total Trips: ${weeklyStats.totalTrips}
• Best Day: ${weeklyStats.bestDay} \\(${(weeklyStats.bestScore * 100).toFixed(1)}%\\)
• Average Rating: ${weeklyStats.averageRating}/5\\.0 ⭐

${weeklyStats.achievement ? `🏆 *Achievement:* ${this.escapeMarkdown(weeklyStats.achievement)}` : ''}

Keep up the great work\\! 💪`

    return await this.sendMessage(chatId, message, 'MarkdownV2')
  }

  /**
   * Send critical alert
   */
  async sendCriticalAlert(chatId: string, driverName: string, issue: string): Promise<boolean> {
    const message = `🚨 *URGENT \\- Mr\\. Nice Drive Alert*

Hello *${this.escapeMarkdown(driverName)}*,

🔴 *Critical Issue Detected:* ${this.escapeMarkdown(issue)}

⚠️ *Action Required:* Please contact management immediately\\.

📞 *Emergency Contact:* \\+971\\-XX\\-XXXXXXX
📧 *Email:* support@mrniceguy\\.ae

This requires immediate attention\\!`

    return await this.sendMessage(chatId, message, 'MarkdownV2')
  }

  /**
   * Get bot information
   */
  async getBotInfo() {
    try {
      const response = await this.client.get('/getMe')
      return response.data.result
    } catch (error) {
      console.error('Failed to get bot info:', error)
      throw new Error('Failed to get Telegram bot information')
    }
  }

  /**
   * Check if chat exists and bot can send messages
   */
  async checkChatAccess(chatId: string): Promise<boolean> {
    try {
      await this.client.get(`/getChat?chat_id=${chatId}`)
      return true
    } catch (error) {
      console.error(`Cannot access chat ${chatId}:`, error)
      return false
    }
  }

  /**
   * Escape special characters for MarkdownV2
   */
  private escapeMarkdown(text: string): string {
    return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1')
  }

  /**
   * Get letter grade from score
   */
  private getGrade(score: number): string {
    if (score >= 0.97) return 'A\\+'
    if (score >= 0.90) return 'A'
    if (score >= 0.85) return 'B\\+'
    if (score >= 0.80) return 'B'
    if (score >= 0.75) return 'C\\+'
    if (score >= 0.70) return 'C'
    if (score >= 0.60) return 'D'
    return 'F'
  }

  /**
   * Get emoji for grade
   */
  private getGradeEmoji(grade: string): string {
    const emojiMap: Record<string, string> = {
      'A\\+': '🏆',
      'A': '🥇',
      'B\\+': '🥈',
      'B': '👍',
      'C\\+': '⚠️',
      'C': '⚠️',
      'D': '🔴',
      'F': '🚨'
    }
    return emojiMap[grade] || '📊'
  }
}

// Singleton instance
let telegramService: TelegramService | null = null

export function getTelegramService(): TelegramService {
  if (!telegramService) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN environment variable is required')
    }
    
    telegramService = new TelegramService(botToken)
  }
  
  return telegramService
}

export function setTelegramService(botToken: string): TelegramService {
  telegramService = new TelegramService(botToken)
  return telegramService
} 