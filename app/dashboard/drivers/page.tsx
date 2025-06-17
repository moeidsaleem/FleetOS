'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert'
import { Skeleton } from '../../../components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog'
import { Label } from '../../../components/ui/label'
import { useToast } from '../../../components/ui/use-toast'
import { 
  Users, 
  Search,
  ArrowLeft,
  UserCheck,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Star,
  MessageSquare,
  Phone,
  Plus,
  Loader2,
  CheckCircle,
  RefreshCw,
  Eye,
  X,
  Filter,
  SortAsc,
  SortDesc
} from 'lucide-react'
import { AlertCallModal } from '../../../components/ui/alert-call-modal'

interface Driver {
  id: string
  name: string
  phoneNumber: string
  language?: 'ENGLISH' | 'ARABIC' | 'HINDI' | 'URDU' | 'FRENCH' | 'RUSSIAN' | 'TAGALOG' | 'SPANISH'
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  uberDriverId?: string
  createdAt: string
  currentScore?: number
  recentAlertsCount?: number
  lastMetricDate?: string
  lastMetrics?: {
    calculatedScore: number
    acceptanceRate: number
    cancellationRate: number
    completionRate: number
    feedbackScore: number
    tripVolume: number
    idleRatio: number
    grade: string
  }
  alertCount?: number
}

interface ModalDriver {
  id: string
  name: string
  phoneNumber: string
  currentScore?: number
}

interface NewDriverForm {
  name: string
  email: string
  phone: string
  uberDriverId: string
  whatsappNumber: string
  telegramUserId: string
  language: 'ENGLISH' | 'ARABIC' | 'HINDI' | 'URDU' | 'FRENCH' | 'RUSSIAN' | 'TAGALOG' | 'SPANISH'
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
}

interface FormErrors {
  name?: string
  email?: string
  phone?: string
  uberDriverId?: string
  whatsappNumber?: string
  telegramUserId?: string
}

// Add Driver Modal Component
function AddDriverModal({ onDriverAdded }: { onDriverAdded: () => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const { toast } = useToast()
  const [formData, setFormData] = useState<NewDriverForm>({
    name: '',
    email: '',
    phone: '',
    uberDriverId: '',
    whatsappNumber: '',
    telegramUserId: '',
    language: 'ENGLISH',
    status: 'ACTIVE'
  })

  // Keyboard shortcut to open modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'n' && !open) {
        event.preventDefault()
        setOpen(true)
      }
      if (event.key === 'Escape' && open && !loading) {
        setOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, loading])

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      uberDriverId: '',
      whatsappNumber: '',
      telegramUserId: '',
      language: 'ENGLISH',
      status: 'ACTIVE'
    })
    setErrors({})
  }

  const validateField = (field: keyof FormErrors, value: string): string | undefined => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'Name is required'
        if (value.trim().length < 2) return 'Name must be at least 2 characters'
        break
      case 'email':
        if (!value.trim()) return 'Email is required'
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) return 'Please enter a valid email address'
        break
      case 'phone':
        if (!value.trim()) return 'Phone number is required'
        const phoneRegex = /^\+?[1-9]\d{8,14}$/
        if (!phoneRegex.test(value.replace(/\s/g, ''))) return 'Please enter a valid phone number'
        break
      case 'uberDriverId':
        if (!value.trim()) return 'Uber Driver ID is required'
        if (value.trim().length < 3) return 'Uber Driver ID must be at least 3 characters'
        break
      case 'whatsappNumber':
        if (value.trim()) {
          const phoneRegex = /^\+?[1-9]\d{8,14}$/
          if (!phoneRegex.test(value.replace(/\s/g, ''))) return 'Please enter a valid WhatsApp number'
        }
        break
    }
    return undefined
  }

  const handleFieldChange = (field: keyof NewDriverForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Real-time validation
    if (field !== 'status') {
      const error = validateField(field as keyof FormErrors, value)
      setErrors(prev => {
        const newErrors = { ...prev }
        if (error) {
          newErrors[field as keyof FormErrors] = error
        } else {
          delete newErrors[field as keyof FormErrors]
        }
        return newErrors
      })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    
    newErrors.name = validateField('name', formData.name)
    newErrors.email = validateField('email', formData.email)
    newErrors.phone = validateField('phone', formData.phone)
    newErrors.uberDriverId = validateField('uberDriverId', formData.uberDriverId)
    newErrors.whatsappNumber = validateField('whatsappNumber', formData.whatsappNumber)
    
    // Remove undefined errors
    Object.keys(newErrors).forEach(key => {
      if (!newErrors[key as keyof FormErrors]) {
        delete newErrors[key as keyof FormErrors]
      }
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form before submitting.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Prepare data for API
      const driverData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        uberDriverId: formData.uberDriverId.trim(),
        // Only include optional fields if they have values
        ...(formData.whatsappNumber.trim() && { whatsappNumber: formData.whatsappNumber.trim() }),
        ...(formData.telegramUserId.trim() && { telegramUserId: formData.telegramUserId.trim() }),
        language: formData.language,
        status: formData.status
      }

      console.log('Sending driver data:', driverData)

      const response = await fetch('/api/drivers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(driverData),
      })

      const result = await response.json()
      console.log('API response:', result)

      if (!result.success) {
        throw new Error(result.error || 'Failed to create driver')
      }

      // Success
      setOpen(false)
      resetForm()
      onDriverAdded()
      
      toast({
        title: "Driver Added Successfully! 🎉",
        description: `${formData.name} has been added to your fleet.`,
        variant: "default",
      })
      
    } catch (err) {
      toast({
        title: "Error Adding Driver",
        description: err instanceof Error ? err.message : 'An unexpected error occurred',
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      setOpen(newOpen)
      if (!newOpen) {
        resetForm()
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="shadow-lg hover:shadow-xl transition-all duration-200 relative">
          <Plus className="h-4 w-4 mr-2" />
          Add New Driver
          <span className="ml-2 text-xs opacity-60 hidden lg:inline">
            ⌘N
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-blue-600" />
            Add New Driver
          </DialogTitle>
          <DialogDescription>
            Add a new driver to your fleet. This will create a driver record that can sync with Uber Fleet API.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="John Doe"
                disabled={loading}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.name}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                placeholder="john@example.com"
                disabled={loading}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.email}
                </p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  placeholder="+971501234567"
                  disabled={loading}
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {errors.phone}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="whatsappNumber" className="text-sm font-medium">
                  WhatsApp Number
                </Label>
                <Input
                  id="whatsappNumber"
                  value={formData.whatsappNumber}
                  onChange={(e) => handleFieldChange('whatsappNumber', e.target.value)}
                  placeholder="+971501234567"
                  disabled={loading}
                  className={errors.whatsappNumber ? 'border-red-500' : ''}
                />
                {errors.whatsappNumber && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {errors.whatsappNumber}
                  </p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="uberDriverId" className="text-sm font-medium">
                  Uber Driver ID <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="uberDriverId"
                  value={formData.uberDriverId}
                  onChange={(e) => handleFieldChange('uberDriverId', e.target.value)}
                  placeholder="uber_driver_123"
                  disabled={loading}
                  className={errors.uberDriverId ? 'border-red-500' : ''}
                />
                {errors.uberDriverId && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {errors.uberDriverId}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="language" className="text-sm font-medium">
                  Preferred Language
                </Label>
                <Select
                  value={formData.language}
                  onValueChange={(value: 'ENGLISH' | 'GERMAN' | 'ARABIC' | 'HINDI' | 'FRENCH' | 'RUSSIAN' | 'TAGALOG' | 'SPANISH') => 
                    handleFieldChange('language', value)
                  }
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENGLISH">🇺🇸 English</SelectItem>
                    <SelectItem value="ARABIC">🇦🇪 العربية (Arabic)</SelectItem>
                    <SelectItem value="HINDI">🇮🇳 हिंदी (Hindi)</SelectItem>
                    <SelectItem value="URDU">🇵🇰 اردو (Urdu)</SelectItem>
                    <SelectItem value="GERMAN">🇩🇪 Deutsch (German)</SelectItem>
                    <SelectItem value="FRENCH">🇫🇷 Français (French)</SelectItem>
                    <SelectItem value="RUSSIAN">🇷🇺 Русский (Russian)</SelectItem>
                    <SelectItem value="TAGALOG">🇵🇭 Tagalog</SelectItem>
                    <SelectItem value="SPANISH">🇪🇸 Español (Spanish)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium">
                  Initial Status
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') => 
                    handleFieldChange('status', value)
                  }
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Active
                      </div>
                    </SelectItem>
                    <SelectItem value="INACTIVE">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                        Inactive
                      </div>
                    </SelectItem>
                    <SelectItem value="SUSPENDED">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        Suspended
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="telegramUserId" className="text-sm font-medium">
                  Telegram Username
                </Label>
                <Input
                  id="telegramUserId"
                  value={formData.telegramUserId}
                  onChange={(e) => handleFieldChange('telegramUserId', e.target.value)}
                  placeholder="@username"
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  For Telegram alerts and notifications
                </p>
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
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || Object.keys(errors).length > 0}
              className="min-w-[120px]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Create Driver
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Hook for debounced search
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [gradeFilter, setGradeFilter] = useState<string>('all')
  const [languageFilter, setLanguageFilter] = useState<string>('all')
  const [syncing, setSyncing] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'score' | 'status' | 'created'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [alertCallModal, setAlertCallModal] = useState<{
    open: boolean
    driver: ModalDriver | null
  }>({
    open: false,
    driver: null
  })
  const { toast } = useToast()

  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const getGradeFromScore = (score: number): string => {
    if (score >= 0.95) return 'A+'
    if (score >= 0.9) return 'A'
    if (score >= 0.85) return 'B+'
    if (score >= 0.8) return 'B'
    if (score >= 0.75) return 'C+'
    if (score >= 0.7) return 'C'
    if (score >= 0.6) return 'D'
    return 'F'
  }

  const getLanguageDisplay = (language?: string) => {
    const languageMap = {
      'ENGLISH': '🇺🇸 EN',
      'ARABIC': '🇦🇪 AR',
      'HINDI': '🇮🇳 HI', 
      'URDU': '🇵🇰 UR',
      'FRENCH': '🇫🇷 FR',
      'RUSSIAN': '🇷🇺 RU',
      'TAGALOG': '🇵🇭 TL',
      'SPANISH': '🇪🇸 ES'
    }
    return language ? languageMap[language as keyof typeof languageMap] || '🌐 --' : '🌐 --'
  }

  const fetchDrivers = async (syncFromUber = false) => {
    try {
      setLoading(true)
      setError(null)
      
      if (syncFromUber) {
        setSyncing(true)
        toast({
          title: "Syncing with Uber Fleet API",
          description: "Fetching latest driver data...",
        })
      }
      
      const url = `/api/drivers${syncFromUber ? '?syncFromUber=true&limit=1000' : '?limit=1000'}`
      console.log('Fetching drivers from:', url)
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Failed to fetch drivers')
      }

      const data = await response.json()
      console.log('API response:', data)
      
      if (!data.success) {
        throw new Error(data.error || 'Invalid response from server')
      }

      // Show sync result toast if present
      if (syncFromUber && data.syncResult) {
        if (data.syncResult.success) {
          toast({
            title: 'Uber Sync Complete! ✅',
            description: `Processed: ${data.syncResult.driversProcessed}, Created: ${data.syncResult.driversCreated}, Updated: ${data.syncResult.driversUpdated}`,
          })
        } else {
          toast({
            title: 'Uber Sync Failed',
            description: data.syncResult.error || (data.syncResult.errors && data.syncResult.errors.join(', ')) || 'Unknown error',
            variant: 'destructive',
          })
        }
      }

      console.log('Raw drivers data:', data.data)

      // Use real data without mock enrichment
      const driversWithMetrics = data.data.map((driver: Driver) => ({
        ...driver,
        lastMetrics: driver.lastMetrics || {
          calculatedScore: driver.currentScore || 0,
          acceptanceRate: 0,
          cancellationRate: 0,
          completionRate: 0,
          feedbackScore: 0,
          tripVolume: 0,
          idleRatio: 0,
          grade: getGradeFromScore(driver.currentScore || 0)
        },
        alertCount: driver.recentAlertsCount || 0
      }))

      console.log('Processed drivers:', driversWithMetrics)
      
      setDrivers(driversWithMetrics)
      
      if (syncFromUber) {
        toast({
          title: "Sync Complete! ✅",
          description: `Updated ${driversWithMetrics.length} drivers from Uber Fleet API.`,
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      toast({
        title: "Error Loading Drivers",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setSyncing(false)
    }
  }

  useEffect(() => {
    fetchDrivers()
  }, [])

  const getScoreColor = (score: number) => {
    if (score >= 0.9) return 'text-green-600'
    if (score >= 0.8) return 'text-yellow-600'
    if (score >= 0.7) return 'text-orange-600'
    return 'text-red-600'
  }

  const getGradeBadgeVariant = (grade: string) => {
    if (['A+', 'A'].includes(grade)) return 'default'
    if (['B+', 'B'].includes(grade)) return 'secondary'
    if (['C+', 'C'].includes(grade)) return 'outline'
    return 'destructive'
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'default'
      case 'INACTIVE': return 'secondary'
      case 'SUSPENDED': return 'destructive'
      default: return 'secondary'
    }
  }

  const sortDrivers = (drivers: Driver[]) => {
    return [...drivers].sort((a, b) => {
      let aValue: string | number | Date, bValue: string | number | Date
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'score':
          aValue = a.lastMetrics?.calculatedScore || 0
          bValue = b.lastMetrics?.calculatedScore || 0
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        case 'created':
          aValue = new Date(a.createdAt)
          bValue = new Date(b.createdAt)
          break
        default:
          return 0
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
  }

  const filteredDrivers = sortDrivers(
    drivers.filter(driver => {
      const matchesSearch = driver.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                           driver.phoneNumber.includes(debouncedSearchTerm) ||
                           (driver.uberDriverId && driver.uberDriverId.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
      const matchesStatus = statusFilter === 'all' || driver.status === statusFilter
      const matchesGrade = gradeFilter === 'all' || driver.lastMetrics?.grade === gradeFilter
      const matchesLanguage = languageFilter === 'all' || driver.language === languageFilter
      
      return matchesSearch && matchesStatus && matchesGrade && matchesLanguage
    })
  )

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const sendAlert = async (driverId: string, channel: 'whatsapp' | 'telegram' | 'voice') => {
    // For voice calls, open the new modal instead
    if (channel === 'voice') {
      const driver = drivers.find(d => d.id === driverId)
      if (driver) {
        setAlertCallModal({
          open: true,
          driver: {
            id: driver.id,
            name: driver.name,
            phoneNumber: driver.phoneNumber,
            currentScore: driver.currentScore
          }
        })
      }
      return
    }

    // Keep existing logic for whatsapp and telegram
    try {
      toast({
        title: `Sending ${channel} alert...`,
        description: "Please wait while we contact the driver.",
      })

      const response = await fetch('/api/drivers/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId, channel, message: 'Performance review requested' })
      })
      
      if (response.ok) {
        toast({
          title: "Alert Sent Successfully! ✅",
          description: `Driver contacted via ${channel}.`,
        })
      } else {
        throw new Error('Failed to send alert')
      }
    } catch (err) {
      toast({
        title: "Failed to Send Alert",
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: "destructive",
      })
    }
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Drivers</AlertTitle>
          <AlertDescription className="mt-2">
            {error}
            <div className="flex gap-2 mt-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => fetchDrivers()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="hover:bg-gray-50">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="h-8 w-8 text-blue-600" />
              Driver Management
            </h1>
            <p className="text-muted-foreground">Manage driver profiles and performance metrics</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => fetchDrivers(true)}
            disabled={syncing}
            className="hover:bg-blue-50"
          >
            {syncing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync from Uber
              </>
            )}
          </Button>
          <AddDriverModal onDriverAdded={() => fetchDrivers()} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{drivers.length}</div>
            <p className="text-xs text-muted-foreground">
              Across all statuses
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Drivers</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {drivers.filter(d => d.status === 'ACTIVE').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Ready for trips
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Performers</CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {drivers.filter(d => d.lastMetrics && d.lastMetrics.calculatedScore >= 0.9).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Score ≥ 90%
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Need Attention</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {drivers.filter(d => d.lastMetrics && d.lastMetrics.calculatedScore < 0.7).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Score &lt; 70%
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Languages</CardTitle>
            <div className="text-lg">🌐</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {new Set(drivers.map(d => d.language).filter(Boolean)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Different languages
            </p>
            <div className="flex gap-1 mt-2 flex-wrap">
              {Array.from(new Set(drivers.map(d => d.language).filter(Boolean)))
                .slice(0, 3)
                .map(lang => (
                  <span key={lang} className="text-xs px-1 py-0.5 bg-blue-100 text-blue-700 rounded">
                    {getLanguageDisplay(lang)}
                  </span>
                ))}
              {new Set(drivers.map(d => d.language).filter(Boolean)).size > 3 && (
                <span className="text-xs px-1 py-0.5 bg-gray-100 text-gray-600 rounded">
                  +{new Set(drivers.map(d => d.language).filter(Boolean)).size - 3}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Filters */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search & Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, phone, or Uber ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-6 w-6 p-0"
                    onClick={() => setSearchTerm('')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px] bg-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ACTIVE">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Active
                    </div>
                  </SelectItem>
                  <SelectItem value="INACTIVE">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                      Inactive
                    </div>
                  </SelectItem>
                  <SelectItem value="SUSPENDED">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      Suspended
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger className="w-[130px] bg-white">
                  <SelectValue placeholder="Grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  <SelectItem value="A+">A+ (95%+)</SelectItem>
                  <SelectItem value="A">A (90-94%)</SelectItem>
                  <SelectItem value="B+">B+ (85-89%)</SelectItem>
                  <SelectItem value="B">B (80-84%)</SelectItem>
                  <SelectItem value="C+">C+ (75-79%)</SelectItem>
                  <SelectItem value="C">C (70-74%)</SelectItem>
                  <SelectItem value="D">D (60-69%)</SelectItem>
                  <SelectItem value="F">F (&lt;60%)</SelectItem>
                </SelectContent>
              </Select>
              <Select value={languageFilter} onValueChange={setLanguageFilter}>
                <SelectTrigger className="w-[150px] bg-white">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  <SelectItem value="ENGLISH">🇺🇸 English</SelectItem>
                  <SelectItem value="ARABIC">🇦🇪 العربية (Arabic)</SelectItem>
                  <SelectItem value="HINDI">🇮🇳 हिंदी (Hindi)</SelectItem>
                  <SelectItem value="URDU">🇵🇰 اردو (Urdu)</SelectItem>
                  <SelectItem value="FRENCH">🇫🇷 Français (French)</SelectItem>
                  <SelectItem value="RUSSIAN">🇷🇺 Русский (Russian)</SelectItem>
                  <SelectItem value="TAGALOG">🇵🇭 Tagalog</SelectItem>
                  <SelectItem value="SPANISH">🇪🇸 Español (Spanish)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {(debouncedSearchTerm || statusFilter !== 'all' || gradeFilter !== 'all' || languageFilter !== 'all') && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">
                  Showing {filteredDrivers.length} of {drivers.length} drivers
                  {debouncedSearchTerm && ` matching "${debouncedSearchTerm}"`}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('')
                    setStatusFilter('all')
                    setGradeFilter('all')
                    setLanguageFilter('all')
                  }}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Clear filters
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Drivers Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Drivers List</CardTitle>
          <CardDescription>
            {filteredDrivers.length} driver{filteredDrivers.length !== 1 ? 's' : ''} shown
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-100 transition-colors min-w-[200px]"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-2">
                        Driver
                        {sortBy === 'name' && (
                          sortOrder === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-100 transition-colors min-w-[100px]"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-2">
                        Status
                        {sortBy === 'status' && (
                          sortOrder === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-100 transition-colors min-w-[120px] hidden sm:table-cell"
                      onClick={() => handleSort('score')}
                    >
                      <div className="flex items-center gap-2">
                        Performance
                        {sortBy === 'score' && (
                          sortOrder === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="min-w-[80px] hidden md:table-cell">Grade</TableHead>
                    <TableHead className="min-w-[80px] hidden lg:table-cell">Alerts</TableHead>
                    <TableHead className="min-w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDrivers.map((driver) => (
                    <TableRow 
                      key={driver.id} 
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <TableCell>
                        <div className="space-y-1">
                          <Link href={`/dashboard/drivers/${driver.id}`}>
                            <div className="font-medium hover:text-blue-600 cursor-pointer transition-colors">
                              {driver.name}
                            </div>
                          </Link>
                          <div className="text-sm text-muted-foreground">{driver.phoneNumber}</div>
                          {driver.uberDriverId && (
                            <div className="text-xs text-muted-foreground">
                              Uber: {driver.uberDriverId}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <span>Language: {getLanguageDisplay(driver.language)}</span>
                          </div>
                          {/* Mobile-only performance display */}
                          <div className="sm:hidden mt-1">
                            {driver.lastMetrics ? (
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-medium ${getScoreColor(driver.lastMetrics.calculatedScore)}`}>
                                  {Math.round(driver.lastMetrics.calculatedScore * 100)}%
                                </span>
                                <Badge variant={getGradeBadgeVariant(driver.lastMetrics.grade)} className="text-xs">
                                  {driver.lastMetrics.grade}
                                </Badge>
                                {driver.alertCount && driver.alertCount > 0 && (
                                  <Badge variant="destructive" className="text-xs">
                                    {driver.alertCount} alerts
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">No performance data</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={getStatusBadgeVariant(driver.status)}
                          className="font-medium text-xs"
                        >
                          {driver.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {driver.lastMetrics ? (
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${getScoreColor(driver.lastMetrics.calculatedScore)}`}>
                              {Math.round(driver.lastMetrics.calculatedScore * 100)}%
                            </span>
                            {driver.lastMetrics.calculatedScore >= 0.8 ? (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">No data</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {driver.lastMetrics ? (
                          <Badge variant={getGradeBadgeVariant(driver.lastMetrics.grade)}>
                            {driver.lastMetrics.grade}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {driver.alertCount && driver.alertCount > 0 ? (
                          <Badge variant="destructive" className="font-medium">
                            {driver.alertCount}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => sendAlert(driver.id, 'whatsapp')}
                            className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600"
                            title="Send WhatsApp message"
                          >
                            <MessageSquare className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => sendAlert(driver.id, 'voice')}
                            className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 hidden sm:inline-flex"
                            title="Make voice call"
                          >
                            <Phone className="h-3 w-3" />
                          </Button>
                          <Link href={`/dashboard/drivers/${driver.id}`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 hover:bg-purple-50 hover:text-purple-600"
                              title="View details"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {!loading && filteredDrivers.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No drivers found</h3>
              <p className="text-muted-foreground mb-4">
                {drivers.length === 0 
                  ? "Get started by adding your first driver to the fleet."
                  : "Try adjusting your search criteria or filters."
                }
              </p>
              {drivers.length === 0 && (
                <AddDriverModal onDriverAdded={() => fetchDrivers()} />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add the AlertCallModal at the end */}
      {alertCallModal.driver && (
        <AlertCallModal
          open={alertCallModal.open}
          onOpenChange={(open) => setAlertCallModal({ open, driver: null })}
          driver={alertCallModal.driver}
        />
      )}
    </div>
  )
} 