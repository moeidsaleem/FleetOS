import React, { useState } from 'react'
import { Dialog, DialogContent, DialogFooter } from './dialog'
import { Button } from './button'
import { Label } from './label'
import { Textarea } from './textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { useToast } from './use-toast'
import { Loader2, Phone, AlertTriangle, Clock, MessageSquare, Send } from 'lucide-react'

interface AlertCallModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  driver: {
    id: string
    name: string
    phoneNumber: string
    currentScore?: number
    language?: string
  }
}

const PREDEFINED_REASONS = [
  { value: 'poor_performance', label: 'Poor Performance', description: 'Driver performance metrics are below standards' },
  { value: 'wrong_area', label: 'Not in Right Area', description: 'Driver is operating outside designated service area' },
  { value: 'idle_time', label: 'Idle for Long Time', description: 'Driver has been inactive for extended period' },
  { value: 'missed_trips', label: 'Missed Trips', description: 'Driver has missed or declined multiple trip requests' },
  { value: 'customer_complaints', label: 'Customer Complaints', description: 'Multiple customer complaints received' },
  { value: 'safety_concerns', label: 'Safety Concerns', description: 'Safety-related issues or violations' },
  { value: 'custom', label: 'Custom Reason', description: 'Specify a custom reason for the alert' }
]

const DEFAULT_MESSAGES: Record<string, string> = {
  poor_performance: 'Dear DRIVER_NAME, your recent performance metrics are below our standards. Please review your recent trips and take steps to improve.',
  wrong_area: 'Dear DRIVER_NAME, you are currently operating outside your designated service area. Please return to your assigned area as soon as possible.',
  idle_time: 'Dear DRIVER_NAME, you have been inactive for an extended period. Please resume activity or contact support if you are experiencing issues.',
  missed_trips: 'Dear DRIVER_NAME, you have missed or declined multiple trip requests. Please ensure you are available to accept trips during your shift.',
  customer_complaints: 'Dear DRIVER_NAME, we have received multiple customer complaints regarding your recent trips. Please address these concerns and maintain high service standards.',
  safety_concerns: 'Dear DRIVER_NAME, there have been safety-related issues or violations reported. Please prioritize safety and adhere to all guidelines.'
}

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ar', name: 'العربية (Arabic)', flag: '🇦🇪' },
  { code: 'es', name: 'Español (Spanish)', flag: '🇪🇸' },
  { code: 'fr', name: 'Français (French)', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch (German)', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano (Italian)', flag: '🇮🇹' },
  { code: 'pt', name: 'Português (Portuguese)', flag: '🇵🇹' },
  { code: 'ru', name: 'Русский (Russian)', flag: '🇷🇺' },
  { code: 'tr', name: 'Türkçe (Turkish)', flag: '🇹🇷' },
  { code: 'nl', name: 'Nederlands (Dutch)', flag: '🇳🇱' },
  { code: 'pl', name: 'Polski (Polish)', flag: '🇵🇱' },
  { code: 'ur', name: 'اردو (Urdu)', flag: '🇵🇰' }
]

export function AlertCallModal({ open, onOpenChange, driver }: AlertCallModalProps) {
  const [loading, setLoading] = useState(false)
  const [selectedReason, setSelectedReason] = useState('')
  const [customMessage, setCustomMessage] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState(driver.language || 'en')
  const [tab, setTab] = useState<'call' | 'whatsapp' | 'telegram'>('call')
  const [message, setMessage] = useState('')
  const { toast } = useToast()

  const selectedReasonData = PREDEFINED_REASONS.find(r => r.value === selectedReason)

  React.useEffect(() => {
    if ((tab === 'whatsapp' || tab === 'telegram') && selectedReason && selectedReason !== 'custom') {
      const template = DEFAULT_MESSAGES[selectedReason]
      setMessage(template ? template.replace('DRIVER_NAME', driver.name) : '')
    } else if (selectedReason === 'custom') {
      setMessage('')
    }
  }, [selectedReason, tab, driver.name])

  const handleSendMessage = async (channel: 'whatsapp' | 'telegram') => {
    if (!message.trim()) {
      toast({ title: 'Message required', description: 'Please enter a message.', variant: 'destructive' })
      return
    }
    setLoading(true)
    setTimeout(() => {
      toast({ title: `Message sent via ${channel.charAt(0).toUpperCase() + channel.slice(1)}`, description: `Message sent to ${driver.name}.`, variant: 'default' })
      setLoading(false)
      setMessage('')
      onOpenChange(false)
    }, 1200)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReason) {
      toast({ title: 'Please select a reason', description: 'You must select a reason for the alert.', variant: 'destructive' })
      return
    }
    if (selectedReason === 'custom' && !customMessage.trim()) {
      toast({ title: 'Please provide a custom message', description: 'Custom reason requires a detailed message.', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      setTimeout(() => {
        toast({ title: 'Alert Call Initiated! 📞', description: `AI is now calling ${driver.name}.`, variant: 'default' })
        setLoading(false)
        setSelectedReason('')
        setCustomMessage('')
        setSelectedLanguage(driver.language || 'en')
        onOpenChange(false)
      }, 1200)
    } catch (error) {
      setLoading(false)
      toast({ title: 'Failed to Initiate Call', description: 'An error occurred.', variant: 'destructive' })
    }
  }

  const handleGenerateAIMessage = () => {
    let aiText = ''
    if (selectedReason === 'custom') {
      aiText = customMessage.trim() || 'Please address the following issue.'
    } else if (selectedReasonData) {
      aiText = `Dear ${driver.name},\n\n${selectedReasonData.description}. Please take the necessary actions.\n\nThank you.`
    } else {
      aiText = 'Please address the following issue.'
    }
    setMessage(aiText)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden rounded-2xl">
        <div className="flex flex-col">
          <div className="p-6 pb-0">
            <Label htmlFor="reason" className="text-sm font-medium">
              Reason for Alert <span className="text-red-500">*</span>
            </Label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason for the alert..." />
              </SelectTrigger>
              <SelectContent>
                {PREDEFINED_REASONS.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    <div className="flex items-center gap-2">
                      {reason.value === 'poor_performance' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                      {reason.value === 'wrong_area' && <MessageSquare className="h-4 w-4 text-orange-500" />}
                      {reason.value === 'idle_time' && <Clock className="h-4 w-4 text-yellow-500" />}
                      {reason.value !== 'poor_performance' && reason.value !== 'wrong_area' && reason.value !== 'idle_time' && (
                        <AlertTriangle className="h-4 w-4 text-gray-500" />
                      )}
                      <span>{reason.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedReasonData && selectedReason !== 'custom' && (
              <p className="text-sm text-muted-foreground mt-1">
                {selectedReasonData.description}
              </p>
            )}
            {selectedReason === 'custom' && (
              <div className="space-y-2 mt-2">
                <Label htmlFor="customMessage" className="text-sm font-medium">
                  Custom Message <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="customMessage"
                  value={customMessage}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCustomMessage(e.target.value)}
                  placeholder="Describe the specific issue or concern that needs to be addressed..."
                  className="min-h-[100px]"
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  This message will be used by the AI or sent as a text to the driver.
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-center gap-2 bg-gradient-to-r from-blue-50 via-white to-purple-50 py-4 border-b mt-6">
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all ${tab === 'call' ? 'bg-blue-600 text-white shadow-lg scale-105' : 'bg-white text-blue-700 hover:bg-blue-100'}`}
              onClick={() => setTab('call')}
              type="button"
            >
              <Phone className="h-5 w-5" /> AI Call
            </button>
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all ${tab === 'whatsapp' ? 'bg-green-500 text-white shadow-lg scale-105' : 'bg-white text-green-700 hover:bg-green-100'}`}
              onClick={() => setTab('whatsapp')}
              type="button"
            >
              <MessageSquare className="h-5 w-5" /> WhatsApp
            </button>
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all ${tab === 'telegram' ? 'bg-blue-400 text-white shadow-lg scale-105' : 'bg-white text-blue-700 hover:bg-blue-100'}`}
              onClick={() => setTab('telegram')}
              type="button"
            >
              <Send className="h-5 w-5" /> Telegram
            </button>
          </div>
          <div className="p-6">
            {tab === 'call' && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-medium">{driver.name}</p>
                    <p className="text-sm text-muted-foreground">{driver.phoneNumber}</p>
                  </div>
                  {driver.currentScore !== undefined && (
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Current Score</p>
                      <p className={`font-bold ${
                        driver.currentScore >= 0.8 ? 'text-green-600' :
                        driver.currentScore >= 0.6 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {Math.round(driver.currentScore * 100)}%
                      </p>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language" className="text-sm font-medium">
                    Language <span className="text-red-500">*</span>
                  </Label>
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a language..." />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_LANGUAGES.map((language) => (
                        <SelectItem key={language.code} value={language.code}>
                          <div className="flex items-center gap-2">
                            <span>{language.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900">AI-Powered Call</p>
                      <p className="text-sm text-blue-700">
                        MNDP AI will call the driver in <strong>{SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.name || 'English'}</strong> and discuss the selected issue professionally. 
                        The AI will adapt the conversation based on the driver&apos;s responses and maintain a respectful tone.
                      </p>
                      <div className="mt-2 text-xs text-blue-600">
                        <strong>Features:</strong> Dynamic variables, custom prompts, multilingual support
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter className="gap-2 mt-4">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
                  <Button type="submit" disabled={loading || !selectedReason || (selectedReason === 'custom' && !customMessage.trim())} className="min-w-[140px]">
                    {loading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Initiating Call...</>) : (<><Phone className="h-4 w-4 mr-2" /> Start AI Call</>)}
                  </Button>
                </DialogFooter>
              </form>
            )}
            {(tab === 'whatsapp' || tab === 'telegram') && (
              <form onSubmit={e => { e.preventDefault(); handleSendMessage(tab) }} className="space-y-6">
                <div className={`p-4 rounded-lg flex items-center gap-4 ${tab === 'whatsapp' ? 'bg-green-50' : 'bg-blue-50'}`}>
                  {tab === 'whatsapp' ? <MessageSquare className="h-6 w-6 text-green-600" /> : <Send className="h-6 w-6 text-blue-500" />}
                  <div>
                    <p className="font-medium">Send {tab === 'whatsapp' ? 'WhatsApp' : 'Telegram'} Message</p>
                    <p className={`text-sm ${tab === 'whatsapp' ? 'text-green-700' : 'text-blue-700'}`}>Send a direct {tab === 'whatsapp' ? 'WhatsApp' : 'Telegram'} message to <strong>{driver.name}</strong>.</p>
                  </div>
                </div>
                {selectedReason !== 'custom' && (
                  <Textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder={`Type your ${tab === 'whatsapp' ? 'WhatsApp' : 'Telegram'} message...`}
                    className="min-h-[100px]"
                    disabled={loading}
                  />
                )}
                {selectedReason === 'custom' && (
                  <>
                    <Textarea
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      placeholder={`Type your custom ${tab === 'whatsapp' ? 'WhatsApp' : 'Telegram'} message...`}
                      className="min-h-[100px]"
                      disabled={loading}
                    />
                    <div className="flex items-center gap-2 mt-2">
                      <Button type="button" variant="outline" onClick={handleGenerateAIMessage} disabled={loading} className="text-xs px-3 py-1 rounded-lg">
                        Generate with AI
                      </Button>
                      <span className="text-xs text-muted-foreground">(Based on your custom message)</span>
                    </div>
                  </>
                )}
                <DialogFooter className="gap-2 mt-4">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
                  <Button type="submit" disabled={loading || !message.trim()} className={`min-w-[140px] ${tab === 'whatsapp' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}>
                    {loading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...</>) : (<>{tab === 'whatsapp' ? <MessageSquare className="h-4 w-4 mr-2" /> : <Send className="h-4 w-4 mr-2" />} Send {tab === 'whatsapp' ? 'WhatsApp' : 'Telegram'}</>)}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
