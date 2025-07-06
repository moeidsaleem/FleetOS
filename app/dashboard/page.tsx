'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '../../components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from'../../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Progress } from '../../components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert'
import { Skeleton } from '../../components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Car, 
  Phone, 
  MessageSquare,
  Send,
  Activity
} from 'lucide-react'
import { LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Link from 'next/link'
import StatCard from '../../components/magicui/StatCard'
import WelcomeText from '../../components/magicui/WelcomeText'
import Hero from '../../components/magicui/Hero'
import { RequireAuth } from '../../components/auth/require-auth'
import React from 'react'
import { useSession } from 'next-auth/react'

interface DashboardStats {
  totalDrivers: number
  activeDrivers: number
  averageScore: number
  alertsSent: number
  tripsCompleted: number
  tripsInProgress: number
  topPerformers: Array<{
    driverId: string
    name: string
    score: number
  }>
  underPerformers: Array<{
    driverId: string
    name: string
    score: number
    alertsPending: number
  }>
  timeRange: string
}

interface ChartData {
  scoreTrend: Array<{
    time: string
    score: number
    label: string
  }>
  alertTrend: Array<{
    time: string
    alerts: number
    label: string
  }>
  performanceDistribution: Array<{
    grade: string
    count: number
    color: string
  }>
  channelEffectiveness: Array<{
    channel: string
    sent: number
    responded: number
    responseRate: number
  }>
}

export default function ProtectedDashboardPage(props: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <RequireAuth>
      <DashboardPage {...props} />
    </RequireAuth>
  )
}

function useCountUp(target: number, duration = 1000) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    const start = 0
    let startTime: number | null = null
    function animate(ts: number) {
      if (!startTime) startTime = ts
      const progress = Math.min((ts - startTime) / duration, 1)
      setValue(Math.floor(progress * (target - start) + start))
      if (progress < 1) requestAnimationFrame(animate)
    }
    if (typeof target === 'number') requestAnimationFrame(animate)
    else setValue(0)
  }, [target, duration])
  return value
}

function DashboardPage(props: React.ComponentPropsWithoutRef<'div'>) {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [timeRange, setTimeRange] = useState('24h')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = async (range: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const [statsResponse, chartsResponse] = await Promise.all([
        fetch(`/api/dashboard/stats?timeRange=${range}`),
        fetch(`/api/dashboard/charts?timeRange=${range}`)
      ])

      if (!statsResponse.ok || !chartsResponse.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const statsData = await statsResponse.json()
      const chartsData = await chartsResponse.json()

      if (!statsData.success || !chartsData.success) {
        throw new Error('Invalid response from server')
      }

      setStats(statsData.data)
      setChartData(chartsData.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData(timeRange)
  }, [timeRange])

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 0.9) return 'default'
    if (score >= 0.8) return 'secondary'
    if (score >= 0.7) return 'outline'
    return 'destructive'
  }

  // Animated stat values
  const totalDrivers = useCountUp(stats?.totalDrivers || 0)
  const activeDrivers = useCountUp(stats?.activeDrivers || 0)
  const averageScore = useCountUp(Math.round((stats?.averageScore || 0) * 100))
  const alertsSent = useCountUp(stats?.alertsSent || 0)
  const tripsCompleted = useCountUp(stats?.tripsCompleted || 0)
  const tripsInProgress = useCountUp(stats?.tripsInProgress || 0)

  if (error) {
    return (
      <DashboardLayout>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load dashboard data: {error}
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2 ml-2"
              onClick={() => fetchDashboardData(timeRange)}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-8">
        {/* Animated Gradient Hero/Welcome Section */}
        <div className="mb-2 relative overflow-hidden rounded-2xl" style={{ minHeight: 120 }}>
          <div className="absolute inset-0 animate-gradient bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-30 blur-2xl z-0" />
          <div className="relative z-10 p-6">
            <Hero />
            <div className="mt-2 text-2xl font-bold text-foreground drop-shadow">
              Good {getGreeting()}, {session?.user?.name?.split(' ')[0] || 'there'}!
            </div>
          </div>
        </div>
        <WelcomeText name={session?.user?.name?.split(' ')[0] || 'Cheikh'} />
        {/* Stat Cards Row with fade-in and count-up */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fadein">
          <StatCard
            icon={<Users className="h-6 w-6" />}
            label="Total Drivers"
            value={loading ? '' : totalDrivers}
            sublabel={loading ? '' : `${activeDrivers} active`}
            loading={loading}
          />
          <StatCard
            icon={<TrendingUp className="h-6 w-6" />}
            label="Average Score"
            value={loading ? '' : `${averageScore}%`}
            sublabel={loading ? '' : 'Fleet average'}
            loading={loading}
          />
          <StatCard
            icon={<AlertTriangle className="h-6 w-6" />}
            label="Alerts Sent"
            value={loading ? '' : alertsSent}
            sublabel={loading ? '' : `Last ${timeRange}`}
            loading={loading}
          />
          <StatCard
            icon={<Car className="h-6 w-6" />}
            label="Trips Completed"
            value={loading ? '' : tripsCompleted}
            sublabel={loading ? '' : `${tripsInProgress} in progress`}
            loading={loading}
          />
        </div>
        {/* Main Content Tabs in a glassy card with fade-in */}
        <div className="rounded-2xl bg-card/80 shadow-xl backdrop-blur p-6 border border-border animate-fadein">
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="alerts">Alerts</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-6">
              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-card/90 shadow-lg rounded-2xl border border-border">
                  <CardHeader>
                    <CardTitle>Score Trend</CardTitle>
                    <CardDescription>Average driver performance over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading || !chartData ? (
                      <Skeleton className="h-[200px] w-full" />
                    ) : (
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={chartData.scoreTrend}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="label" 
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            stroke="currentColor"
                          />
                          <YAxis 
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}%`}
                            stroke="currentColor"
                          />
                          <Tooltip 
                            contentStyle={{ background: 'var(--card)', color: 'var(--card-foreground)' }}
                            formatter={(value) => [`${value}%`, 'Score']}
                            labelFormatter={(label) => `Time: ${label}`}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="score" 
                            stroke="#8884d8" 
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
                <Card className="bg-card/90 shadow-lg rounded-2xl border border-border">
                  <CardHeader>
                    <CardTitle>Alert Activity</CardTitle>
                    <CardDescription>Alerts sent over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading || !chartData ? (
                      <Skeleton className="h-[200px] w-full" />
                    ) : (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={chartData.alertTrend}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="label" 
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            stroke="currentColor"
                          />
                          <YAxis 
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            stroke="currentColor"
                          />
                          <Tooltip 
                            contentStyle={{ background: 'var(--card)', color: 'var(--card-foreground)' }}
                            formatter={(value) => [value, 'Alerts']}
                            labelFormatter={(label) => `Time: ${label}`}
                          />
                          <Bar dataKey="alerts" fill="#ff6b6b" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>
              {/* Performance Lists */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-card/90 shadow-lg rounded-2xl border border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      Top Performers
                    </CardTitle>
                    <CardDescription>Highest scoring drivers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                          <Skeleton key={i} className="h-12 w-full" />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {stats?.topPerformers?.slice(0, 5).map((driver, index) => (
                          <div key={driver.driverId} className="flex items-center justify-between p-3 bg-background/70 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-sm font-bold">
                                {index + 1}
                              </div>
                              <span className="font-medium text-foreground">{driver.name}</span>
                            </div>
                            <Badge variant="default">
                              {Math.round(driver.score * 100)}%
                            </Badge>
                          </div>
                        )) || (
                          <p className="text-muted-foreground text-center py-4">
                            No performance data available
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card className="bg-card/90 shadow-lg rounded-2xl border border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      Needs Attention
                    </CardTitle>
                    <CardDescription>Underperforming drivers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                          <Skeleton key={i} className="h-12 w-full" />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {stats?.underPerformers?.slice(0, 5).map((driver) => (
                          <div key={driver.driverId} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-red-100 text-red-800 rounded-full flex items-center justify-center">
                                <AlertTriangle className="h-4 w-4" />
                              </div>
                              <span className="font-medium text-foreground">{driver.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {driver.alertsPending > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {driver.alertsPending} alerts
                                </Badge>
                              )}
                              <Badge variant="destructive">
                                {Math.round(driver.score * 100)}%
                              </Badge>
                            </div>
                          </div>
                        )) || (
                          <p className="text-muted-foreground text-center py-4">
                            All drivers performing well!
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="performance" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-card/90 shadow-lg rounded-2xl border border-border">
                  <CardHeader>
                    <CardTitle>Performance Distribution</CardTitle>
                    <CardDescription>Driver grades distribution</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading || !chartData ? (
                      <Skeleton className="h-[300px] w-full" />
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData.performanceDistribution}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="grade" stroke="currentColor" />
                          <YAxis stroke="currentColor" />
                          <Tooltip contentStyle={{ background: 'var(--card)', color: 'var(--card-foreground)' }} />
                          <Bar dataKey="count" fill="#8884d8">
                            {chartData.performanceDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-card/90 shadow-lg rounded-2xl border border-border">
                  <CardHeader>
                    <CardTitle>Grade Summary</CardTitle>
                    <CardDescription>Performance grade breakdown</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading || !chartData ? (
                      <div className="space-y-3">
                        {[...Array(8)].map((_, i) => (
                          <Skeleton key={i} className="h-8 w-full" />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {chartData.performanceDistribution.map((grade) => (
                          <div key={grade.grade} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-4 h-4 rounded"
                                style={{ backgroundColor: grade.color }}
                              />
                              <span className="font-medium text-foreground">Grade {grade.grade}</span>
                            </div>
                            <Badge variant="outline">{grade.count} drivers</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="alerts" className="space-y-6">
              <Card className="bg-card/90 shadow-lg rounded-2xl border border-border">
                <CardHeader>
                  <CardTitle>Communication Channel Effectiveness</CardTitle>
                  <CardDescription>Response rates by alert method</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading || !chartData ? (
                    <Skeleton className="h-[200px] w-full" />
                  ) : (
                    <div className="space-y-4">
                      {chartData.channelEffectiveness.map((channel) => (
                        <div key={channel.channel} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {channel.channel === 'WhatsApp' && <MessageSquare className="h-5 w-5 text-green-600" />}
                              {channel.channel === 'Voice Call' && <Phone className="h-5 w-5 text-blue-600" />}
                              {channel.channel === 'Telegram' && <Send className="h-5 w-5 text-sky-600" />}
                              <span className="font-medium text-foreground">{channel.channel}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-foreground">{channel.responseRate}% response rate</div>
                              <div className="text-xs text-muted-foreground">
                                {channel.responded}/{channel.sent} responded
                              </div>
                            </div>
                          </div>
                          <Progress value={channel.responseRate} className="h-2" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        {/* Confetti animation if top performer hits 100% */}
        {stats?.topPerformers?.some(tp => Math.round(tp.score * 100) === 100) && (
          <div className="fixed inset-0 pointer-events-none z-50 animate-confetti" />
        )}
      </div>
    </DashboardLayout>
  )
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
} 