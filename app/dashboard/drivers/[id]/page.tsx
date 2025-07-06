'use client'

import { useState, useEffect } from 'react'
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
  Users
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { RequireAuth } from '../../../../components/auth/require-auth'
import React from 'react'
import { DashboardLayout } from '../../../../components/layout/dashboard-layout'

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

export default function ProtectedDriverDetailPage(props: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <RequireAuth>
      <DashboardLayout>
        <DriverDetailPage {...props} />
      </DashboardLayout>
    </RequireAuth>
  )
}

function DriverDetailPage(props: React.ComponentPropsWithoutRef<'div'>) {
  const params = useParams()
  const [driver, setDriver] = useState<DriverDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [includeUberData, setIncludeUberData] = useState(false)

  const fetchDriverDetails = async () => {
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
  }

  useEffect(() => {
    fetchDriverDetails()
  }, [params.id, includeUberData])

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
          <Button 
            variant="outline"
            onClick={() => setIncludeUberData(!includeUberData)}
          >
            <Activity className="h-4 w-4 mr-2" />
            {includeUberData ? 'Hide' : 'Show'} Uber Data
          </Button>
          <Badge 
            variant={driver.driver.status === 'ACTIVE' ? 'default' : 'secondary'}
            className={getStatusColor(driver.driver.status)}
          >
            {driver.driver.status}
          </Badge>
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
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="contact">Contact Info</TabsTrigger>
          {driver.uber && <TabsTrigger value="uber">Uber Data</TabsTrigger>}
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
                      <Tooltip 
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

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
              <CardDescription>Latest alert history for this driver</CardDescription>
            </CardHeader>
            <CardContent>
              {driver.alerts.recent.length > 0 ? (
                <div className="space-y-4">
                  {driver.alerts.recent.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getPriorityColor(alert.priority)}`}></div>
                        <div>
                          <p className="font-medium">{alert.reason}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(alert.createdAt).toLocaleDateString()} • {alert.type}
                          </p>
                        </div>
                      </div>
                      <Badge variant={alert.status === 'SENT' ? 'default' : 'secondary'}>
                        {alert.status}
                      </Badge>
                    </div>
                  ))}
                </div>
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
      </Tabs>
    </div>
  )
} 