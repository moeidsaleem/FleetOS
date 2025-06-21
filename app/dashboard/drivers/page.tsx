'use client'

import { useState, useEffect } from 'react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert'
import { useToast } from '../../../components/ui/use-toast'
import { Plus, AlertTriangle } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { Badge } from '../../../components/ui/badge'
import { AlertCallModal } from '../../../components/ui/alert-call-modal'
import { RefreshCw } from 'lucide-react'

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
  const { toast } = useToast()
  const [alertCallModal, setAlertCallModal] = useState<{
    open: boolean
    driver: Driver | null
  }>({
    open: false,
    driver: null
  })

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

  const fetchDrivers = async (syncFromUber = false) => {
    try {
      setLoading(true)
      setError(null)
      
      if (syncFromUber) {
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
    }
  }

  useEffect(() => {
    fetchDrivers()
  }, [])

  const getGradeBadgeVariant = (grade: string) => {
    if (['A+', 'A'].includes(grade)) return 'default'
    if (['B+', 'B'].includes(grade)) return 'secondary'
    if (['C+', 'C'].includes(grade)) return 'outline'
    return 'destructive'
  }

  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = driver.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                         driver.phoneNumber.includes(debouncedSearchTerm) ||
                         (driver.uberDriverId && driver.uberDriverId.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || driver.status === statusFilter
    const matchesGrade = gradeFilter === 'all' || driver.lastMetrics?.grade === gradeFilter
    const matchesLanguage = languageFilter === 'all' || driver.language === languageFilter
    
    return matchesSearch && matchesStatus && matchesGrade && matchesLanguage
  })

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
      {/* Header and Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-700 via-purple-600 to-pink-500 bg-clip-text text-transparent tracking-tight mb-1">Drivers</h1>
          <p className="text-gray-500 text-lg">Manage your fleet drivers, performance, and alerts.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <Input
            placeholder="Search drivers..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="rounded-xl bg-white/80 border border-gray-200 shadow-inner focus:ring-2 focus:ring-blue-200 min-w-[220px]"
          />
          <Button onClick={() => setAlertCallModal({ open: true, driver: null })} className="bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg shadow-md px-6 py-2">
            <Plus className="h-4 w-4 mr-2" /> Add Driver
          </Button>
        </div>
      </div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6 bg-white/80 rounded-xl p-4 shadow-sm border border-gray-100">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 rounded-lg">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
          </SelectContent>
        </Select>
        <Select value={gradeFilter} onValueChange={setGradeFilter}>
          <SelectTrigger className="w-36 rounded-lg">
            <SelectValue placeholder="Grade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Grades</SelectItem>
            <SelectItem value="A+">A+</SelectItem>
            <SelectItem value="A">A</SelectItem>
            <SelectItem value="B+">B+</SelectItem>
            <SelectItem value="B">B</SelectItem>
            <SelectItem value="C+">C+</SelectItem>
            <SelectItem value="C">C</SelectItem>
            <SelectItem value="D">D</SelectItem>
            <SelectItem value="F">F</SelectItem>
          </SelectContent>
        </Select>
        <Select value={languageFilter} onValueChange={setLanguageFilter}>
          <SelectTrigger className="w-36 rounded-lg">
            <SelectValue placeholder="Language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Languages</SelectItem>
            <SelectItem value="ENGLISH">English</SelectItem>
            <SelectItem value="ARABIC">Arabic</SelectItem>
            <SelectItem value="HINDI">Hindi</SelectItem>
            <SelectItem value="URDU">Urdu</SelectItem>
            <SelectItem value="FRENCH">French</SelectItem>
            <SelectItem value="RUSSIAN">Russian</SelectItem>
            <SelectItem value="TAGALOG">Tagalog</SelectItem>
            <SelectItem value="SPANISH">Spanish</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {/* Driver List Table */}
      <div className="overflow-x-auto rounded-2xl shadow-lg bg-white/90 border border-gray-100">
        <Table className="min-w-full divide-y divide-gray-200">
          <TableHeader className="bg-gradient-to-r from-blue-50 via-white to-purple-50">
            <TableRow>
              <TableHead className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Driver</TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Performance</TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Grade</TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Alerts</TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i} className="animate-pulse">
                  <TableCell className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-3/4" /></TableCell>
                  <TableCell className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-1/2" /></TableCell>
                  <TableCell className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-1/2" /></TableCell>
                  <TableCell className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-1/4" /></TableCell>
                  <TableCell className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-1/4" /></TableCell>
                  <TableCell className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-1/4" /></TableCell>
                </TableRow>
              ))
            ) : filteredDrivers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-400 py-12 text-lg">No drivers found.</TableCell>
              </TableRow>
            ) : (
              filteredDrivers.map(driver => (
                <TableRow key={driver.id} className="hover:bg-blue-50/40 transition-all">
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <div className="font-bold text-gray-900">{driver.name}</div>
                    <div className="text-xs text-gray-500">{driver.phoneNumber}</div>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={driver.status === 'ACTIVE' ? 'default' : driver.status === 'SUSPENDED' ? 'destructive' : 'secondary'} className="text-xs">
                      {driver.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    {driver.lastMetrics ? (
                      <span className="font-semibold text-blue-700">{Math.round(driver.lastMetrics.calculatedScore * 100)}%</span>
                    ) : (
                      <span className="text-gray-400">--</span>
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    {driver.lastMetrics ? (
                      <Badge variant={getGradeBadgeVariant(driver.lastMetrics.grade)} className="text-xs">
                        {driver.lastMetrics.grade}
                      </Badge>
                    ) : (
                      <span className="text-gray-400">--</span>
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    {driver.alertCount && driver.alertCount > 0 ? (
                      <Badge variant="destructive" className="text-xs font-semibold">
                        {driver.alertCount}
                      </Badge>
                    ) : (
                      <span className="text-gray-400">None</span>
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap flex gap-2">
                    <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setAlertCallModal({ open: true, driver })}>
                      Alert
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-lg" asChild>
                      <a href={`/dashboard/drivers/${driver.id}`}>View</a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {/* Restore AlertCallModal at the bottom */}
      {alertCallModal.driver && (
        <AlertCallModal
          open={alertCallModal.open}
          onOpenChange={open => setAlertCallModal({ open, driver: open ? alertCallModal.driver : null })}
          driver={alertCallModal.driver}
        />
      )}
    </div>
  )
} 