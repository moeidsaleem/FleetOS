'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Badge } from '../../../../components/ui/badge'
import { Button } from '../../../../components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '../../../../components/ui/alert'
import { Skeleton } from '../../../../components/ui/skeleton'
import { Progress } from '../../../../components/ui/progress'
import { 
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  AlertTriangle,
  MessageSquare,
  Target,
  Activity,
  Zap,
  Users,
  FileText,
  RefreshCw,
  Send
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts'
import { RequireAuth } from '../../../../components/auth/require-auth'
import React from 'react'
import { DashboardLayout } from '../../../../components/layout/dashboard-layout'
import { Dialog, DialogContent, DialogFooter } from '../../../../components/ui/dialog'
import { Input } from '../../../../components/ui/input'
import { useToast } from '../../../../components/ui/use-toast'
import { useRouter } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select'
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/table'
import { useSession } from 'next-auth/react'
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '../../../../components/ui/tooltip'
import { formatDistanceToNow } from 'date-fns'

interface DriverDetail {
  driver: {
    id: string
    name: string
    email: string
    phone: string
    whatsappNumber?: string
    telegramUserId?: string
    status: string
    uberDriverId?: string
    joinedAt: string
    updatedAt: string
    language?: string
  }
  performance: {
    currentScore: number
    avgScore: number
    scoreBreakdown: {
      breakdown: Record<string, { label: string; contribution: number }>
      grade: string
    } | null
    trend: Array<{
      date: string
      score: number
      acceptance: number
      cancellation: number
      completion: number
      feedback: number
    }>
    metricsCount: number
    analyticsTrend: Array<{
      date: string
      analyticsMetrics?: {
        hoursOnline?: number
        hoursOnTrip?: number
        trips?: number
        earnings?: number
      }
      analyticsScore?: number
    }>
  }
  alerts: {
    recent: Array<{
      id: string
      type: string
      priority: string
      reason: string
      status: string
      sentAt: string
      createdAt: string
      triggeredBy?: string
      error?: string
    }>
    totalCount: number
  }
  uber?: {
    details: {
      status: string
      created_at: string
      updated_at: string
    }
    activity: {
      tripCount: number
      completedTrips: number
      cancelledTrips: number
      totalEarnings: number
      avgTripTime: number
    }
  }
  summary: {
    totalMetrics: number
    totalAlerts: number
    lastMetricDate: string
    memberSince: string
  }
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function ProtectedDriverDetailPage() {
  return (
    <RequireAuth>
      <DashboardLayout>
        <DriverDetailPage />
      </DashboardLayout>
    </RequireAuth>
  )
}

function DriverDetailPage() {
  const params = useParams()
  const [driver, setDriver] = useState<DriverDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [includeUberData, setIncludeUberData] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editForm, setEditForm] = useState<any>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [editFieldErrors, setEditFieldErrors] = useState<{ [k: string]: string }>({})
  const [editChecking, setEditChecking] = useState<{ email: boolean; uberDriverId: boolean }>({ email: false, uberDriverId: false })
  const [editDuplicate, setEditDuplicate] = useState<{ email: boolean; uberDriverId: boolean }>({ email: false, uberDriverId: false })
  const [syncing, setSyncing] = useState(false)

  const fetchDriverDetails = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const url = `/api/drivers/${params.id}?days=30&includeUberData=${includeUberData}`
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Failed to fetch driver details')
      }

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || 'Invalid response from server')
      }

      setDriver(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [params.id, includeUberData])

  useEffect(() => {
    fetchDriverDetails()
  }, [fetchDriverDetails])

  useEffect(() => {
    if (driver) {
      setEditForm({
        name: driver.driver.name,
        email: driver.driver.email,
        phone: driver.driver.phone,
        status: driver.driver.status,
        uberDriverId: driver.driver.uberDriverId || '',
        language: driver.driver.language || 'ENGLISH',
      })
    }
  }, [driver])

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value })
    setEditFieldErrors({ ...editFieldErrors, [e.target.name]: '' })
    setEditDuplicate({ ...editDuplicate, [e.target.name]: false })
  }
  const handleEditSelect = (field: string, value: string) => {
    setEditForm({ ...editForm, [field]: value })
  }
  const handleEditPhoneChange = (value: string | undefined) => {
    setEditForm({ ...editForm, phone: value || '' })
    setEditFieldErrors({ ...editFieldErrors, phone: '' })
  }
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errors: { [k: string]: string } = {}
    if (!editForm.name?.trim()) errors.name = 'Name is required.'
    if (!editForm.email?.trim()) errors.email = 'Email is required.'
    if (!editForm.phone?.trim()) errors.phone = 'Phone is required.'
    else if (!isValidPhoneNumber(editForm.phone)) errors.phone = 'Invalid phone number.'
    if (editDuplicate.email) errors.email = 'A driver with this email already exists.'
    if (editDuplicate.uberDriverId) errors.uberDriverId = 'A driver with this Uber Driver ID already exists.'
    if (Object.keys(errors).length > 0) {
      setEditFieldErrors(errors)
      return
    }
    if (!driver) return;
    setEditLoading(true)
    try {
      const res = await fetch(`/api/drivers/${driver.driver.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast({ title: 'Error', description: data.error || 'Failed to update driver', variant: 'destructive' })
        setEditLoading(false)
        return
      }
      toast({ title: 'Driver Updated', description: 'Driver details updated successfully!' })
      setEditOpen(false)
      fetchDriverDetails()
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update driver', variant: 'destructive' })
    } finally {
      setEditLoading(false)
    }
  }
  const handleDelete = async () => {
    if (!driver) return;
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/drivers/${driver.driver.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast({ title: 'Error', description: data.error || 'Failed to delete driver', variant: 'destructive' })
        setDeleteLoading(false)
        return
      }
      toast({ title: 'Driver Deleted', description: 'Driver has been deleted.' })
      router.push('/dashboard/drivers')
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to delete driver', variant: 'destructive' })
    } finally {
      setDeleteLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.9) return 'text-green-600'
    if (score >= 0.8) return 'text-yellow-600'
    if (score >= 0.7) return 'text-orange-600'
    return 'text-red-600'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-600'
      case 'INACTIVE': return 'text-gray-600'
      case 'SUSPENDED': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  // Async duplicate check for email (edit)
  const checkEditDuplicateEmail = async () => {
    if (!editForm.email?.trim() || !validateEmail(editForm.email)) return
    setEditChecking(c => ({ ...c, email: true }))
    setEditDuplicate(d => ({ ...d, email: false }))
    try {
      const res = await fetch(`/api/drivers?email=${encodeURIComponent(editForm.email)}`)
      if (res.ok) {
        const data = await res.json()
        if (data.data && Array.isArray(data.data)) {
          // Exclude current driver
          const found = data.data.find((d: any) => d.id !== driver?.driver.id)
          if (found) {
            setEditDuplicate(d => ({ ...d, email: true }))
            setEditFieldErrors(e => ({ ...e, email: 'A driver with this email already exists.' }))
          }
        }
      }
    } catch {}
    setEditChecking(c => ({ ...c, email: false }))
  }

  // Async duplicate check for Uber Driver ID (edit)
  const checkEditDuplicateUberId = async () => {
    if (!editForm.uberDriverId?.trim()) return
    setEditChecking(c => ({ ...c, uberDriverId: true }))
    setEditDuplicate(d => ({ ...d, uberDriverId: false }))
    try {
      const res = await fetch(`/api/drivers?uberDriverId=${encodeURIComponent(editForm.uberDriverId)}`)
      if (res.ok) {
        const data = await res.json()
        if (data.data && Array.isArray(data.data)) {
          // Exclude current driver
          const found = data.data.find((d: any) => d.id !== driver?.driver.id)
          if (found) {
            setEditDuplicate(d => ({ ...d, uberDriverId: true }))
            setEditFieldErrors(e => ({ ...e, uberDriverId: 'A driver with this Uber Driver ID already exists.' }))
          }
        }
      }
    } catch {}
    setEditChecking(c => ({ ...c, uberDriverId: false }))
  }

  // Add re-sync handler
  const handleResyncUber = async () => {
    if (!driver?.driver.uberDriverId) return
    setSyncing(true)
    try {
      const res = await fetch(`/api/drivers/${driver.driver.id}/sync-uber`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Driver synced from Uber', variant: 'default' })
        fetchDriverDetails()
      } else {
        toast({ title: 'Sync failed', description: data.error, variant: 'destructive' })
      }
    } catch (e) {
      toast({ title: 'Sync error', description: String(e), variant: 'destructive' })
    }
    setSyncing(false)
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load driver details: {error}
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2 ml-2"
              onClick={fetchDriverDetails}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!driver) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Driver Not Found</AlertTitle>
          <AlertDescription>
            The requested driver could not be found.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const scoreBreakdownData = driver.performance.scoreBreakdown?.breakdown ? 
    Object.entries(driver.performance.scoreBreakdown.breakdown).map(([, value]) => ({
      name: value.label,
      value: value.contribution,
      percentage: Math.round(value.contribution * 100)
    })) : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/drivers">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Drivers
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <User className="h-8 w-8 text-blue-600" />
              {driver.driver.name}
            </h1>
            <p className="text-muted-foreground">Driver Performance Details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIncludeUberData(!includeUberData)}>
            <Activity className="h-4 w-4 mr-2" />
            {includeUberData ? 'Hide' : 'Show'} Uber Data
          </Button>
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            Edit
          </Button>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            Delete
          </Button>
          <Badge variant={driver.driver.status === 'ACTIVE' ? 'default' : 'secondary'} className={getStatusColor(driver.driver.status)}>
            {driver.driver.status}
          </Badge>
          {driver.driver.uberDriverId && (
            <Button onClick={handleResyncUber} disabled={syncing} variant="outline" className="flex items-center gap-2">
              <RefreshCw className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Syncing...' : 'Re-Sync from Uber'}
            </Button>
          )}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(driver.performance.currentScore)}`}>
              {Math.round(driver.performance.currentScore * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Grade: {driver.performance.scoreBreakdown?.grade || 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Score (30d)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(driver.performance.avgScore)}`}>
              {Math.round(driver.performance.avgScore * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {driver.performance.metricsCount} data points
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {driver.summary.totalAlerts}
            </div>
            <p className="text-xs text-muted-foreground">
              {driver.alerts.recent.length} recent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Member Since</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Date(driver.summary.memberSince).toLocaleDateString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.floor((Date.now() - new Date(driver.summary.memberSince).getTime()) / (1000 * 60 * 60 * 24))} days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics Trend</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="contact">Contact Info</TabsTrigger>
          <TabsTrigger value="uber">Uber Data</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Trend (Last 7 Days)</CardTitle>
                <CardDescription>Daily performance score over time</CardDescription>
              </CardHeader>
              <CardContent>
                {driver.performance.trend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={driver.performance.trend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <YAxis domain={[0, 1]} tickFormatter={(value) => `${Math.round(value * 100)}%`} />
                      <RechartsTooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        formatter={(value: number) => [`${Math.round(value * 100)}%`, 'Score']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No performance data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Score Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Score Breakdown</CardTitle>
                <CardDescription>Contribution of each metric to overall score</CardDescription>
              </CardHeader>
              <CardContent>
                {scoreBreakdownData.length > 0 ? (
                  <div className="space-y-4">
                    {scoreBreakdownData.map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{item.name}</span>
                          <span className="font-medium">{item.percentage}%</span>
                        </div>
                        <Progress value={item.percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                    No score breakdown available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {driver.performance.trend.length > 0 && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Acceptance Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(driver.performance.trend[0].acceptance * 100)}%
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Cancellation Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {Math.round(driver.performance.trend[0].cancellation * 100)}%
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Completion Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.round(driver.performance.trend[0].completion * 100)}%
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Trend (Last 30 Days)</CardTitle>
              <CardDescription>Uber analytics-based metrics and score</CardDescription>
            </CardHeader>
            <CardContent>
              {driver.performance.analyticsTrend && driver.performance.analyticsTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={driver.performance.analyticsTrend.map((d: any) => ({
                    date: d.date,
                    hoursOnline: d.analyticsMetrics?.hoursOnline ?? null,
                    hoursOnTrip: d.analyticsMetrics?.hoursOnTrip ?? null,
                    trips: d.analyticsMetrics?.trips ?? null,
                    earnings: d.analyticsMetrics?.earnings ?? null,
                    analyticsScore: d.analyticsScore ?? null
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={v => new Date(v).toLocaleDateString()} />
                    <YAxis yAxisId="left" orientation="left" label={{ value: 'Hours/Trips', angle: -90, position: 'insideLeft' }} />
                    <YAxis yAxisId="right" orientation="right" label={{ value: 'Score (%)', angle: 90, position: 'insideRight' }} domain={[0, 1]} tickFormatter={v => `${Math.round(v * 100)}%`} />
                    <RechartsTooltip formatter={(value: any, name: string) => {
                      if (name === 'analyticsScore') return [`${Math.round(value * 100)}%`, 'Score']
                      if (name === 'earnings') return [`${Math.round(value)} AED`, 'Earnings']
                      return [value, name]
                    }} labelFormatter={v => new Date(v).toLocaleDateString()} />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="hoursOnline" stroke="#6366f1" name="Hours Online" dot={false} />
                    <Line yAxisId="left" type="monotone" dataKey="hoursOnTrip" stroke="#06b6d4" name="Hours On Trip" dot={false} />
                    <Line yAxisId="left" type="monotone" dataKey="trips" stroke="#f59e42" name="Trips" dot={false} />
                    <Line yAxisId="left" type="monotone" dataKey="earnings" stroke="#22c55e" name="Earnings" dot={false} />
                    <Line yAxisId="right" type="monotone" dataKey="analyticsScore" stroke="#ef4444" name="Analytics Score" dot={{ fill: '#ef4444' }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No analytics data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
              <CardDescription>Latest alert history for this driver</CardDescription>
            </CardHeader>
            <CardContent>
              {driver.alerts.recent.length > 0 ? (
                <TooltipProvider>
                <div className="overflow-x-auto rounded-2xl border border-border">
                  <table className="min-w-full divide-y divide-border">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-bold">Type</th>
                        <th className="px-4 py-2 text-left text-xs font-bold">Channel</th>
                        <th className="px-4 py-2 text-left text-xs font-bold">Reason</th>
                        <th className="px-4 py-2 text-left text-xs font-bold">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-bold">Created</th>
                        <th className="px-4 py-2 text-left text-xs font-bold">Triggered By</th>
                        <th className="px-4 py-2 text-left text-xs font-bold">Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {driver.alerts.recent.map((alert) => {
                        // Channel badge/icon logic
                        let channelIcon = null, channelColor = 'bg-gray-200 text-gray-800'
                        const channelLabel = alert.type
                        if (channelLabel === 'WHATSAPP') { channelIcon = <MessageSquare className="h-4 w-4 text-green-600" />; channelColor = 'bg-green-100 text-green-800' }
                        else if (channelLabel === 'TELEGRAM') { channelIcon = <Send className="h-4 w-4 text-sky-600" />; channelColor = 'bg-sky-100 text-sky-800' }
                        else if (channelLabel === 'CALL') { channelIcon = <Phone className="h-4 w-4 text-blue-600" />; channelColor = 'bg-blue-100 text-blue-800' }
                        else if (channelLabel === 'EMAIL') { channelIcon = <Mail className="h-4 w-4 text-purple-600" />; channelColor = 'bg-purple-100 text-purple-800' }
                        // Status badge
                        const statusVariant = alert.status === 'SENT' ? 'default' : alert.status === 'FAILED' ? 'destructive' : 'secondary'
                        // Relative time
                        const createdDate = new Date(alert.createdAt)
                        const relativeTime = formatDistanceToNow(createdDate, { addSuffix: true })
                        return (
                          <tr key={alert.id} className="hover:bg-muted/40 transition-all">
                            <td className="px-4 py-2">{alert.type}</td>
                            <td className="px-4 py-2">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${channelColor}`}
                                aria-label={`Channel ${channelLabel}`}
                                tabIndex={0}
                              >
                                {channelIcon} {channelLabel}
                              </span>
                            </td>
                            <td className="px-4 py-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="truncate max-w-[120px] inline-block align-bottom" tabIndex={0}>{alert.reason}</span>
                                </TooltipTrigger>
                                <TooltipContent>{alert.reason}</TooltipContent>
                              </Tooltip>
                            </td>
                            <td className="px-4 py-2">
                              <Badge variant={statusVariant}>{alert.status}</Badge>
                            </td>
                            <td className="px-4 py-2 text-xs">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span tabIndex={0}>{relativeTime}</span>
                                </TooltipTrigger>
                                <TooltipContent>{createdDate.toLocaleString()}</TooltipContent>
                              </Tooltip>
                            </td>
                            <td className="px-4 py-2">
                              <Badge variant={alert.triggeredBy === 'AUTO' ? 'secondary' : 'default'}>{alert.triggeredBy}</Badge>
                            </td>
                            <td className="px-4 py-2">
                              {alert.status === 'FAILED' && alert.error ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="text-red-600 text-xs truncate max-w-[100px] inline-block align-bottom" tabIndex={0}>{alert.error}</span>
                                  </TooltipTrigger>
                                  <TooltipContent>{alert.error}</TooltipContent>
                                </Tooltip>
                              ) : null}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                </TooltipProvider>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                  No alerts found for this driver
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Driver&apos;s contact details and communication preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Phone</p>
                      <p className="text-sm text-muted-foreground">{driver.driver.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">{driver.driver.email}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  {driver.driver.whatsappNumber && (
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="font-medium">WhatsApp</p>
                        <p className="text-sm text-muted-foreground">{driver.driver.whatsappNumber}</p>
                      </div>
                    </div>
                  )}
                  {driver.driver.telegramUserId && (
                    <div className="flex items-center gap-3">
                      <Zap className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="font-medium">Telegram</p>
                        <p className="text-sm text-muted-foreground">{driver.driver.telegramUserId}</p>
                      </div>
                    </div>
                  )}
                  {driver.driver.uberDriverId && (
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-black" />
                      <div>
                        <p className="font-medium">Uber Driver ID</p>
                        <p className="text-sm text-muted-foreground">{driver.driver.uberDriverId}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {driver.uber && (
          <TabsContent value="uber" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Uber Profile</CardTitle>
                  <CardDescription>Information from Uber Fleet API</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="font-medium">Status</p>
                      <p className="text-sm text-muted-foreground">{driver.uber.details.status}</p>
                    </div>
                    <div>
                      <p className="font-medium">Created</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(driver.uber.details.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Last Updated</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(driver.uber.details.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Last 7 days from Uber</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Trips</span>
                      <span className="font-medium">{driver.uber.activity.tripCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Completed</span>
                      <span className="font-medium text-green-600">{driver.uber.activity.completedTrips}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cancelled</span>
                      <span className="font-medium text-red-600">{driver.uber.activity.cancelledTrips}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Earnings</span>
                      <span className="font-medium">{Math.round(driver.uber.activity.totalEarnings)} AED</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Trip Time</span>
                      <span className="font-medium">{driver.uber.activity.avgTripTime} min</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        <TabsContent value="documents" className="space-y-4">
          <DriverDocuments driverId={driver.driver.id} />
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <DriverNotes driverId={driver.driver.id} />
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <DriverActivityTimeline driverId={driver.driver.id} />
        </TabsContent>
      </Tabs>
      {/* Edit Modal */}
      {driver && (
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <h2 className="text-xl font-bold mb-2">Edit Driver</h2>
              <div className="space-y-2">
                <label htmlFor="name" className="font-medium">Name</label>
                <Input id="name" name="name" value={editForm?.name || ''} onChange={handleEditChange} required disabled={editLoading} />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="font-medium">Email</label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={editForm?.email || ''}
                  onChange={handleEditChange}
                  onBlur={checkEditDuplicateEmail}
                  required
                  disabled={editLoading}
                />
                {editChecking.email && <p className="text-xs text-blue-600 mt-1">Checking for duplicate email...</p>}
                {editFieldErrors.email && <p className="text-xs text-red-600 mt-1">{editFieldErrors.email}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="phone" className="font-medium">Phone</label>
                <PhoneInput
                  id="phone"
                  name="phone"
                  value={editForm?.phone || ''}
                  onChange={handleEditPhoneChange}
                  defaultCountry="AE"
                  international
                  countryCallingCodeEditable={false}
                  disabled={editLoading}
                  className="rounded-lg border border-border px-3 py-2 w-full bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="e.g. +971501234567"
                />
                {editFieldErrors.phone && <p className="text-xs text-red-600 mt-1">{editFieldErrors.phone}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="uberDriverId" className="font-medium">Uber Driver ID</label>
                <Input
                  id="uberDriverId"
                  name="uberDriverId"
                  value={editForm?.uberDriverId || ''}
                  onChange={handleEditChange}
                  onBlur={checkEditDuplicateUberId}
                  disabled={editLoading}
                />
                {editChecking.uberDriverId && <p className="text-xs text-blue-600 mt-1">Checking for duplicate Uber Driver ID...</p>}
                {editFieldErrors.uberDriverId && <p className="text-xs text-red-600 mt-1">{editFieldErrors.uberDriverId}</p>}
              </div>
              <div className="space-y-2">
                <label className="font-medium">Status</label>
                <Select value={editForm?.status || 'ACTIVE'} onValueChange={v => handleEditSelect('status', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="font-medium">Language</label>
                <Select value={editForm?.language || 'ENGLISH'} onValueChange={v => handleEditSelect('language', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
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
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={editLoading}>Cancel</Button>
                <Button type="submit" disabled={editLoading}>{editLoading ? 'Saving...' : 'Save Changes'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
      {/* Delete Confirmation Dialog */}
      {driver && (
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <h2 className="text-xl font-bold mb-2">Delete Driver</h2>
            <p>Are you sure you want to delete this driver? This action cannot be undone.</p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleteLoading}>Cancel</Button>
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleteLoading}>{deleteLoading ? 'Deleting...' : 'Delete'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function DriverDocuments({ driverId }: { driverId: string }) {
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [type, setType] = useState('LICENSE')
  const [expiryDate, setExpiryDate] = useState('')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()

  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/drivers/${driverId}/documents`)
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to fetch documents')
      setDocuments(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [driverId])
  useEffect(() => { fetchDocuments() }, [fetchDocuments])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null)
    setUploadError(null)
  }
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploadError(null)
    if (!file) { setUploadError('Please select a file.'); return }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)
      if (expiryDate) formData.append('expiryDate', expiryDate)
      const res = await fetch(`/api/drivers/${driverId}/documents`, { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setUploadError(data.error || 'Failed to upload document')
        toast({ title: 'Upload failed', description: data.error || 'Failed to upload document', variant: 'destructive' })
      } else {
        toast({ title: 'Document uploaded', description: data.data.fileName + ' uploaded successfully!' })
        setFile(null); setExpiryDate(''); setType('LICENSE')
        fetchDocuments()
      }
    } catch (err) {
      setUploadError('Failed to upload document')
      toast({ title: 'Upload failed', description: 'Failed to upload document', variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }
  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/drivers/${driverId}/documents/${deleteId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast({ title: 'Delete failed', description: data.error || 'Failed to delete document', variant: 'destructive' })
      } else {
        toast({ title: 'Document deleted', description: 'Document deleted successfully.' })
        fetchDocuments()
      }
    } catch {
      toast({ title: 'Delete failed', description: 'Failed to delete document', variant: 'destructive' })
    } finally {
      setDeleting(false); setDeleteId(null)
    }
  }
  const now = new Date()
  return (
    <div className="space-y-6">
      <form onSubmit={handleUpload} className="flex flex-col md:flex-row gap-4 items-end bg-muted/30 p-4 rounded-xl border border-border">
        <div className="flex flex-col gap-1">
          <label className="font-medium">File</label>
          <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} disabled={uploading} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-medium">Type</label>
          <select className="rounded-lg border border-border px-3 py-2 bg-background" value={type} onChange={e => setType(e.target.value)} disabled={uploading}>
            <option value="LICENSE">License</option>
            <option value="EMIRATES_ID">Emirates ID</option>
            <option value="VISA">Visa</option>
            <option value="INSURANCE">Insurance</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-medium">Expiry Date</label>
          <Input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} disabled={uploading} />
        </div>
        <Button type="submit" disabled={uploading}>{uploading ? 'Uploading...' : 'Upload'}</Button>
      </form>
      {uploadError && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{uploadError}</AlertDescription></Alert>}
      <div className="overflow-x-auto rounded-2xl shadow-lg bg-card border border-border">
        <Table className="min-w-full divide-y divide-border">
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>File Name</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6}>Loading...</TableCell></TableRow>
            ) : error ? (
              <TableRow><TableCell colSpan={6} className="text-red-600">{error}</TableCell></TableRow>
            ) : documents.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-muted-foreground">No documents found.</TableCell></TableRow>
            ) : (
              documents.map(doc => {
                const isExpired = doc.expiryDate && new Date(doc.expiryDate) < now
                const isExpiring = doc.expiryDate && new Date(doc.expiryDate) < new Date(now.getTime() + 7*24*60*60*1000) && !isExpired
                return (
                  <TableRow key={doc.id} className={isExpired ? 'bg-red-50 dark:bg-red-900/20' : isExpiring ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}>
                    <TableCell><Badge variant="secondary">{doc.type}</Badge></TableCell>
                    <TableCell>{doc.fileName}</TableCell>
                    <TableCell>{doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : <span className="text-muted-foreground">N/A</span>}</TableCell>
                    <TableCell><Badge variant={doc.status === 'VALID' ? 'default' : 'destructive'}>{doc.status}</Badge></TableCell>
                    <TableCell>{new Date(doc.uploadedAt).toLocaleDateString()}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button size="sm" variant="outline" asChild><a href={doc.filePath} target="_blank" rel="noopener noreferrer">Download</a></Button>
                      <Button size="sm" variant="destructive" onClick={() => setDeleteId(doc.id)}>Delete</Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={v => { if (!v) setDeleteId(null) }}>
        <DialogContent>
          <h2 className="text-xl font-bold mb-2">Delete Document</h2>
          <p>Are you sure you want to delete this document? This action cannot be undone.</p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DriverActivityTimeline({ driverId }: { driverId: string }) {
  const [activity, setActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`/api/drivers/${driverId}/activity`)
      .then(res => res.json())
      .then(data => {
        if (!data.success) throw new Error(data.error || 'Failed to fetch activity')
        setActivity(data.data)
      })
      .catch(err => setError(err.message || 'Unknown error'))
      .finally(() => setLoading(false))
  }, [driverId])

  if (loading) return <div className="p-6 text-center text-muted-foreground">Loading activity...</div>
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>
  if (!activity.length) return <div className="p-6 text-center text-muted-foreground">No activity found.</div>

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold mb-2">Activity Timeline</h2>
      <ol className="relative border-l-2 border-border ml-4">
        {activity.map((event, i) => (
          <li key={event.id} className="mb-8 ml-6">
            <span className={
              `absolute -left-4 flex items-center justify-center w-8 h-8 rounded-full ring-4 ring-background ${
                event.type === 'alert' ? 'bg-orange-500 text-white' :
                event.type === 'document' ? 'bg-blue-500 text-white' :
                'bg-gray-400 text-white'
              }`
            }>
              {event.type === 'alert' ? <AlertTriangle className="h-5 w-5" /> : null}
              {event.type === 'document' ? <FileText className="h-5 w-5" /> : null}
              {/* Add more icons for other event types if needed */}
            </span>
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-foreground">{event.description}</span>
              <span className="text-xs text-muted-foreground">{new Date(event.timestamp).toLocaleString()}</span>
              {/* Optionally, show more meta info */}
              {event.type === 'alert' && (
                <span className="text-xs text-orange-700">Status: {event.meta.status}, Priority: {event.meta.priority}</span>
              )}
              {event.type === 'document' && (
                <span className="text-xs text-blue-700">File: {event.meta.fileName}, Status: {event.meta.status}</span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

function DriverNotes({ driverId }: { driverId: string }) {
  const [notes, setNotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [adding, setAdding] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { toast } = useToast()
  const { data: session } = useSession();
  const author = session?.user?.name || 'Unknown'

  const fetchNotes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/drivers/${driverId}/notes`)
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to fetch notes')
      setNotes(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [driverId])
  useEffect(() => { fetchNotes() }, [fetchNotes])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    setAdding(true)
    try {
      const res = await fetch(`/api/drivers/${driverId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author, content })
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast({ title: 'Add failed', description: data.error || 'Failed to add note', variant: 'destructive' })
      } else {
        toast({ title: 'Note added', description: 'Note added successfully.' })
        setContent('')
        fetchNotes()
      }
    } catch {
      toast({ title: 'Add failed', description: 'Failed to add note', variant: 'destructive' })
    } finally {
      setAdding(false)
    }
  }
  const handleDelete = async (noteId: string) => {
    setDeletingId(noteId)
    try {
      const res = await fetch(`/api/drivers/${driverId}/notes/${noteId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast({ title: 'Delete failed', description: data.error || 'Failed to delete note', variant: 'destructive' })
      } else {
        toast({ title: 'Note deleted', description: 'Note deleted successfully.' })
        fetchNotes()
      }
    } catch {
      toast({ title: 'Delete failed', description: 'Failed to delete note', variant: 'destructive' })
    } finally {
      setDeletingId(null)
    }
  }
  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-4 items-end bg-muted/30 p-4 rounded-xl border border-border">
        <div className="flex-1 flex flex-col gap-1">
          <label className="font-medium">Add Note</label>
          <textarea
            className="rounded-lg border border-border px-3 py-2 w-full bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[60px]"
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Write a note about this driver..."
            disabled={adding}
            maxLength={1000}
            required
          />
        </div>
        <Button type="submit" disabled={adding || !content.trim()}>{adding ? 'Adding...' : 'Add Note'}</Button>
      </form>
      <div className="overflow-x-auto rounded-2xl shadow-lg bg-card border border-border">
        {loading ? (
          <div className="p-6 text-center text-muted-foreground">Loading notes...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">{error}</div>
        ) : notes.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">No notes found for this driver.</div>
        ) : (
          <table className="min-w-full divide-y divide-border">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Author</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Note</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {notes.map((note: any) => (
                <tr key={note.id} className="hover:bg-muted/40 dark:hover:bg-muted/20 transition-all">
                  <td className="px-6 py-4 whitespace-nowrap font-semibold">{note.author}</td>
                  <td className="px-6 py-4 whitespace-pre-line">{note.content}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-muted-foreground">{new Date(note.createdAt).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(note.id)} disabled={deletingId === note.id}>{deletingId === note.id ? 'Deleting...' : 'Delete'}</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
} 