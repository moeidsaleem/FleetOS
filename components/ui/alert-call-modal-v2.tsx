import React, { useState, useEffect } from 'react'
import { Card } from '../ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Textarea } from '../ui/textarea'
import { Alert } from '../ui/alert'
import { Loader2, Phone, AlertTriangle, Clock, MessageSquare, Send, X, ChevronDown } from 'lucide-react'

// Dummy MagicUI import for animated grid, can be replaced or removed
// import { AnimatedGridPattern } from '../magicui/animated-grid-pattern'

const REASONS = [
  { value: 'poor_performance', label: 'Poor Performance', icon: <AlertTriangle className="h-4 w-4 text-red-500" />, description: 'Performance below standards' },
  { value: 'wrong_area', label: 'Not in Right Area', icon: <MessageSquare className="h-4 w-4 text-orange-500" />, description: 'Operating outside service area' },
  { value: 'idle_time', label: 'Idle for Long Time', icon: <Clock className="h-4 w-4 text-yellow-500" />, description: 'Inactive for extended period' },
  { value: 'missed_trips', label: 'Missed Trips', icon: <AlertTriangle className="h-4 w-4 text-gray-500" />, description: 'Missed/declined trips' },
  { value: 'customer_complaints', label: 'Customer Complaints', icon: <AlertTriangle className="h-4 w-4 text-gray-500" />, description: 'Multiple complaints' },
  { value: 'safety_concerns', label: 'Safety Concerns', icon: <AlertTriangle className="h-4 w-4 text-gray-500" />, description: 'Safety issues' },
  { value: 'custom', label: 'Custom Reason', icon: <AlertTriangle className="h-4 w-4 text-blue-500" />, description: 'Specify a custom reason' }
]

const TONES = [
  { value: 'friendly', label: 'Friendly', color: 'bg-green-100 text-green-800' },
  { value: 'firm', label: 'Firm', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' },
  { value: 'neutral', label: 'Neutral', color: 'bg-gray-100 text-gray-800' }
]

const LANGUAGES = [
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

export interface AlertCallModalV2Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  driver: {
    id: string
    name: string
    phoneNumber: string
    currentScore?: number
    language?: string
    avatarUrl?: string
  }
}

export function AlertCallModalV2({ open, onOpenChange, driver }: AlertCallModalV2Props) {
  // State
  const [reason, setReason] = useState('')
  const [tone, setTone] = useState('friendly')
  const [language, setLanguage] = useState(driver.language || 'en')
  const [customMessage, setCustomMessage] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  // Fetch recent alerts/calls
  useEffect(() => {
    if (open && driver.id) {
      fetch(`/api/drivers/${driver.id}/alert-history?limit=3`).then(res => res.json()).then(data => {
        if (data.success && Array.isArray(data.history)) setHistory(data.history)
        else setHistory([])
      }).catch(() => setHistory([]))
    }
    setPreview(null)
    setFeedback(null)
  }, [open, driver.id])

  // Preview message
  const handlePreview = async () => {
    setPreviewLoading(true)
    setPreview(null)
    try {
      const res = await fetch('/api/drivers/alert-call/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId: driver.id,
          reason: REASONS.find(r => r.value === reason)?.label || customMessage || 'Manual alert',
          message: reason === 'custom' ? customMessage : (REASONS.find(r => r.value === reason)?.description || ''),
          driverName: driver.name,
          currentScore: driver.currentScore || 0,
          language,
          tone
        })
      })
      const data = await res.json()
      if (res.ok && data.success) setPreview(data.preview)
      else setPreview('Could not generate preview.')
    } catch {
      setPreview('Could not generate preview.')
    } finally {
      setPreviewLoading(false)
    }
  }

  // Start AI Call
  const handleStartCall = async () => {
    setLoading(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/drivers/alert-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId: driver.id,
          reason: REASONS.find(r => r.value === reason)?.label || customMessage || 'Manual alert',
          message: reason === 'custom' ? customMessage : (REASONS.find(r => r.value === reason)?.description || ''),
          driverName: driver.name,
          phoneNumber: driver.phoneNumber,
          currentScore: driver.currentScore || 0,
          language,
          tone
        })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setFeedback({ type: 'success', message: 'AI Call initiated successfully!' })
        setReason('')
        setCustomMessage('')
        setPreview(null)
        setTimeout(() => onOpenChange(false), 1200)
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to initiate call.' })
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  // Layout
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="relative w-full max-w-lg mx-auto rounded-2xl shadow-xl bg-white dark:bg-zinc-900 p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold">AI Alert Call to Driver</h2>
          <button onClick={() => onOpenChange(false)} aria-label="Close" className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"><X className="h-5 w-5" /></button>
        </div>
        {/* Driver Overview */}
        <Card className="flex items-center gap-4 px-6 py-4 border-0 border-b rounded-none">
          <Avatar className="h-12 w-12 text-xl">
            {driver.avatarUrl ? (
              <AvatarImage src={driver.avatarUrl} alt={driver.name} />
            ) : (
              <AvatarFallback>{driver.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)}</AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base">{driver.name}</span>
              <span className="text-xs text-zinc-500">{driver.phoneNumber}</span>
              <span className="ml-2 text-lg">{LANGUAGES.find(l => l.code === language)?.flag}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={`text-xs ${typeof driver.currentScore === 'number' ? (driver.currentScore >= 0.8 ? 'bg-green-100 text-green-800' : driver.currentScore >= 0.6 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800') : 'bg-gray-100 text-gray-800'}`}>Score: {typeof driver.currentScore === 'number' ? Math.round(driver.currentScore * 100) : '--'}%</Badge>
              <div className="flex gap-1 ml-2 overflow-x-auto max-w-[180px]">
                {history.length === 0 && <span className="text-xs text-zinc-400">No recent alerts</span>}
                {history.map((alert, idx) => (
                  <Badge key={alert.id || idx} className="text-xs bg-zinc-100 text-zinc-700 flex items-center gap-1">
                    {REASONS.find(r => r.label === alert.reason)?.icon || <AlertTriangle className="h-3 w-3" />} {alert.reason} <span className="ml-1">({alert.status})</span>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>
        {/* Alert Config */}
        <Card className="px-6 py-6 border-0 border-b rounded-none bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Reason</label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select reason..." /></SelectTrigger>
                <SelectContent>
                  {REASONS.map(r => (
                    <SelectItem key={r.value} value={r.value} className="flex items-center gap-2">{r.icon} {r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tone</label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select tone..." /></SelectTrigger>
                <SelectContent>
                  {TONES.map(t => (
                    <SelectItem key={t.value} value={t.value}><span className={`inline-block rounded px-2 py-1 text-xs ${t.color}`}>{t.label}</span></SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Language</label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select language..." /></SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map(l => (
                    <SelectItem key={l.code} value={l.code}><span className="flex items-center gap-2">{l.flag} {l.name}</span></SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {reason === 'custom' && (
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium mb-1">Custom Message</label>
                <Textarea value={customMessage} onChange={e => setCustomMessage(e.target.value)} placeholder="Describe the specific issue or concern..." className="min-h-[80px]" />
              </div>
            )}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Button type="button" onClick={handlePreview} disabled={previewLoading || !reason || (reason === 'custom' && !customMessage.trim())}>
              {previewLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Preview Message'}
            </Button>
            {preview && (
              <Card className="ml-2 p-3 bg-white border text-xs max-w-xs overflow-auto shadow-sm">{preview}</Card>
            )}
          </div>
        </Card>
        {/* Action Bar */}
        <div className="flex items-center justify-between px-6 py-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleStartCall} disabled={loading || !reason || (reason === 'custom' && !customMessage.trim())} className="min-w-[140px]">
            {loading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Initiating Call...</>) : (<><Phone className="h-4 w-4 mr-2" /> Start AI Call</>)}
          </Button>
        </div>
        {/* Feedback */}
        {feedback && (
          <div className="px-6 pb-4">
            <Alert variant={feedback.type === 'success' ? 'default' : 'destructive'}>{feedback.message}</Alert>
          </div>
        )}
      </div>
    </div>
  )
} 