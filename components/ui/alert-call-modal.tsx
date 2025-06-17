'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './dialog'
import { Button } from './button'
import { Label } from './label'
import { Textarea } from './textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { useToast } from './use-toast'
import { Loader2, Phone, AlertTriangle, Clock, MessageSquare } from 'lucide-react'

interface AlertCallModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  driver: {
    id: string
    name: string
    phoneNumber: string
    currentScore?: number
    language?: string // Driver's preferred language
  }
}

const PREDEFINED_REASONS = [
  {
    value: 'poor_performance',
    label: 'Poor Performance',
    description: 'Driver performance metrics are below standards'
  },
  {
    value: 'wrong_area',
    label: 'Not in Right Area',
    description: 'Driver is operating outside designated service area'
  },
  {
    value: 'idle_time',
    label: 'Idle for Long Time',
    description: 'Driver has been inactive for extended period'
  },
  {
    value: 'missed_trips',
    label: 'Missed Trips',
    description: 'Driver has missed or declined multiple trip requests'
  },
  {
    value: 'customer_complaints',
    label: 'Customer Complaints',
    description: 'Multiple customer complaints received'
  },
  {
    value: 'safety_concerns',
    label: 'Safety Concerns',
    description: 'Safety-related issues or violations'
  },
  {
    value: 'custom',
    label: 'Custom Reason',
    description: 'Specify a custom reason for the alert call'
  }
]

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
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedReason) {
      toast({
        title: "Please select a reason",
        description: "You must select a reason for the alert call.",
        variant: "destructive",
      })
      return
    }

    if (selectedReason === 'custom' && !customMessage.trim()) {
      toast({
        title: "Please provide a custom message",
        description: "Custom reason requires a detailed message.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const reasonData = PREDEFINED_REASONS.find(r => r.value === selectedReason)
      const finalMessage = selectedReason === 'custom' 
        ? customMessage.trim()
        : reasonData?.description || selectedReason

      console.log('Initiating alert call for driver:', driver.name)

      const response = await fetch('/api/drivers/alert-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          driverId: driver.id,
          reason: reasonData?.label || 'Custom Reason',
          message: finalMessage,
          driverName: driver.name,
          phoneNumber: driver.phoneNumber,
          currentScore: driver.currentScore || 0,
          language: selectedLanguage
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = 'Failed to initiate alert call'
        
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        
        throw new Error(errorMessage)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to initiate alert call')
      }

      console.log('Alert call initiated successfully:', result.data)

      toast({
        title: "Alert Call Initiated! 📞",
        description: `ElevenLabs AI is now calling ${driver.name} about ${reasonData?.label.toLowerCase()}.`,
      })

      // Reset form and close modal
      setSelectedReason('')
      setCustomMessage('')
      setSelectedLanguage(driver.language || 'en')
      onOpenChange(false)

    } catch (error) {
      console.error('Alert call error:', error)
      
      let errorMessage = 'An unexpected error occurred'
      
      if (error instanceof Error) {
        if (error.message.includes('ElevenLabs configuration')) {
          errorMessage = 'ElevenLabs is not properly configured. Please check your API settings.'
        } else if (error.message.includes('Invalid ElevenLabs API key')) {
          errorMessage = 'Invalid ElevenLabs API key. Please check your configuration.'
        } else if (error.message.includes('Access denied')) {
          errorMessage = 'Your ElevenLabs plan may not include outbound calling features.'
        } else if (error.message.includes('Rate limit')) {
          errorMessage = 'Too many requests. Please try again in a few minutes.'
        } else {
          errorMessage = error.message
        }
      }
      
      toast({
        title: "Failed to Initiate Call",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      onOpenChange(newOpen)
      if (!newOpen) {
        setSelectedReason('')
        setCustomMessage('')
        setSelectedLanguage(driver.language || 'en')
      }
    }
  }

  const selectedReasonData = PREDEFINED_REASONS.find(r => r.value === selectedReason)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-blue-600" />
            Schedule Alert Call
          </DialogTitle>
          <DialogDescription>
            Initiate an AI-powered outbound call to <strong>{driver.name}</strong> using MNDP AI.
            The AI will discuss the selected issue professionally.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Driver Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
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
            </div>

            {/* Reason Selection */}
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-sm font-medium">
                Reason for Alert Call <span className="text-red-500">*</span>
              </Label>
              <Select value={selectedReason} onValueChange={setSelectedReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason for the call..." />
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
                <p className="text-sm text-muted-foreground">
                  {selectedReasonData.description}
                </p>
              )}
            </div>

            {/* Custom Message for Custom Reason */}
            {selectedReason === 'custom' && (
              <div className="space-y-2">
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
                  This message will be used by the AI to discuss the issue with the driver.
                </p>
              </div>
            )}

            {/* Language Selection */}
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

            {/* AI Call Info */}
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
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !selectedReason || (selectedReason === 'custom' && !customMessage.trim())}
              className="min-w-[140px]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Initiating Call...
                </>
              ) : (
                <>
                  <Phone className="h-4 w-4 mr-2" />
                  Start AI Call
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 