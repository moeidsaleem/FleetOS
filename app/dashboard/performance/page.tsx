'use client'
import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../../components/layout/dashboard-layout';
import { RequireAuth } from '../../../components/auth/require-auth';
import { BentoGrid, BentoCard } from '@/components/magicui/bento-grid';
import StatCard from '@/components/magicui/StatCard';
import { Users, TrendingUp, AlertTriangle, Car, Trophy, ArrowDownCircle, BarChart2, MessageSquare, Phone, Send } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from 'recharts';
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Animated count-up hook 
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
    if (typeof target === 'number' && !isNaN(target)) requestAnimationFrame(animate)
    else setValue(0)
  }, [target, duration])
  return value
}

export default function PerformancePage() {
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [statsRes, chartsRes] = await Promise.all([
          fetch(`/api/dashboard/stats?timeRange=${timeRange}`),
          fetch(`/api/dashboard/charts?timeRange=${timeRange}`),
        ]);
        const statsData = await statsRes.json();
        const chartsData = await chartsRes.json();
        if (!statsData.success || !chartsData.success) throw new Error('Failed to fetch data');
        setStats(statsData.data);
        setChartData(chartsData.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [timeRange]);

  // Helper for top/under performer
  const topPerformer = stats?.topPerformers?.[0];
  const underPerformer = stats?.underPerformers?.[0];

  // Animated stat values
  const totalDrivers = useCountUp(stats?.totalDrivers || 0)
  const activeDrivers = useCountUp(stats?.activeDrivers || 0)
  const averageScore = useCountUp(Math.round((stats?.averageScore || 0) * 100))
  const alertsSent = useCountUp(stats?.alertsSent || 0)
  const tripsCompleted = useCountUp(stats?.tripsCompleted || 0)
  const tripsInProgress = useCountUp(stats?.tripsInProgress || 0)
  const topPerformerScore = useCountUp(topPerformer && topPerformer.score != null ? Math.round(topPerformer.score * 100) : 0)
  const underPerformerScore = useCountUp(underPerformer && underPerformer.score != null ? Math.round(underPerformer.score * 100) : 0)

  // Helper for grade filter link
  const getGradeFilterLink = (grade: string) => `/dashboard/drivers?grade=${encodeURIComponent(grade)}`;

  return (
    <RequireAuth>
      <DashboardLayout>
        <div className="container mx-auto py-8">
          <h1 className="text-4xl font-extrabold mb-8 text-center">Performance Overview</h1>
          <div className="flex justify-center mb-6 gap-2">
            <button
              className={`px-4 py-2 rounded-lg border ${timeRange === '24h' ? 'bg-blue-600 text-white' : 'bg-card text-foreground border-border'} transition`}
              onClick={() => setTimeRange('24h')}
              aria-pressed={timeRange === '24h'}
            >
              24h
            </button>
            <button
              className={`px-4 py-2 rounded-lg border ${timeRange === '7d' ? 'bg-blue-600 text-white' : 'bg-card text-foreground border-border'} transition`}
              onClick={() => setTimeRange('7d')}
              aria-pressed={timeRange === '7d'}
            >
              7d
            </button>
            <button
              className={`px-4 py-2 rounded-lg border ${timeRange === '30d' ? 'bg-blue-600 text-white' : 'bg-card text-foreground border-border'} transition`}
              onClick={() => setTimeRange('30d')}
              aria-pressed={timeRange === '30d'}
            >
              30d
            </button>
          </div>
          {error && (
            <div className="text-red-600 text-center mb-4">{error}</div>
          )}
          <BentoGrid className="mb-8">
            {/* Average Score */}
            <BentoCard
              name="Average Score"
              className="col-span-1 cursor-pointer hover:shadow-lg focus:ring-2 focus:ring-blue-500"
              background={<div className="absolute inset-0 bg-gradient-to-br from-blue-100/40 to-blue-300/10" />}
              Icon={TrendingUp}
              description="Fleet-wide average driver score"
              href="/dashboard/performance"
              cta="View Details"
            >
              {loading ? (
                <StatCard
                  icon={<TrendingUp className="h-8 w-8 text-blue-600" />}
                  label="Average Score"
                  value={''}
                  sublabel={`Last ${timeRange}`}
                  loading={true}
                />
              ) : (
                <StatCard
                  icon={<TrendingUp className="h-8 w-8 text-blue-600" />}
                  label="Average Score"
                  value={stats?.averageScore != null ? `${averageScore}%` : '--'}
                  sublabel={`Last ${timeRange}`}
                  loading={false}
                />
              )}
            </BentoCard>
            {/* Total Drivers */}
            <BentoCard
              name="Total Drivers"
              className="col-span-1 cursor-pointer hover:shadow-lg focus:ring-2 focus:ring-blue-500"
              background={<div className="absolute inset-0 bg-gradient-to-br from-green-100/40 to-green-300/10" />}
              Icon={Users}
              description="Total number of drivers in the fleet"
              href="/dashboard/drivers"
              cta="View Drivers"
            >
              {loading ? (
                <StatCard
                  icon={<Users className="h-8 w-8 text-green-600" />}
                  label="Total Drivers"
                  value={''}
                  sublabel={''}
                  loading={true}
                />
              ) : (
                <StatCard
                  icon={<Users className="h-8 w-8 text-green-600" />}
                  label="Total Drivers"
                  value={stats?.totalDrivers != null ? totalDrivers.toLocaleString() : '--'}
                  sublabel={`${stats?.activeDrivers != null ? activeDrivers.toLocaleString() : '--'} active`}
                  loading={false}
                />
              )}
            </BentoCard>
            {/* Alerts Sent */}
            <BentoCard
              name="Alerts Sent"
              className="col-span-1 cursor-pointer hover:shadow-lg focus:ring-2 focus:ring-blue-500"
              background={<div className="absolute inset-0 bg-gradient-to-br from-orange-100/40 to-orange-300/10" />}
              Icon={AlertTriangle}
              description="Total alerts sent to drivers"
              href="/dashboard/alerts"
              cta="View Alerts"
            >
              {loading ? (
                <StatCard
                  icon={<AlertTriangle className="h-8 w-8 text-orange-600" />}
                  label="Alerts Sent"
                  value={''}
                  sublabel={`Last ${timeRange}`}
                  loading={true}
                />
              ) : (
                <StatCard
                  icon={<AlertTriangle className="h-8 w-8 text-orange-600" />}
                  label="Alerts Sent"
                  value={stats?.alertsSent != null ? alertsSent.toLocaleString() : '--'}
                  sublabel={`Last ${timeRange}`}
                  loading={false}
                />
              )}
            </BentoCard>
            {/* Trips Completed */}
            <BentoCard
              name="Trips Completed"
              className="col-span-1 cursor-pointer hover:shadow-lg focus:ring-2 focus:ring-blue-500"
              background={<div className="absolute inset-0 bg-gradient-to-br from-purple-100/40 to-purple-300/10" />}
              Icon={Car}
              description="Total trips completed by the fleet"
              href="/dashboard/trips"
              cta="View Trips"
            >
              {loading ? (
                <StatCard
                  icon={<Car className="h-8 w-8 text-purple-600" />}
                  label="Trips Completed"
                  value={''}
                  sublabel={''}
                  loading={true}
                />
              ) : (
                <StatCard
                  icon={<Car className="h-8 w-8 text-purple-600" />}
                  label="Trips Completed"
                  value={stats?.tripsCompleted != null ? tripsCompleted.toLocaleString() : '--'}
                  sublabel={`${stats?.tripsInProgress != null ? tripsInProgress.toLocaleString() : '--'} in progress`}
                  loading={false}
                />
              )}
            </BentoCard>
            {/* Top Performer */}
            <BentoCard
              name="Top Performer"
              className="col-span-1 cursor-pointer hover:shadow-lg focus:ring-2 focus:ring-blue-500"
              background={<div className="absolute inset-0 bg-gradient-to-br from-yellow-100/40 to-yellow-300/10" />}
              Icon={Trophy}
              description={topPerformer ? `Best driver: ${topPerformer.name}` : 'No data'}
              href={topPerformer ? `/dashboard/drivers/${topPerformer.driverId}` : '/dashboard/drivers'}
              cta="View Driver"
            >
              {loading ? (
                <StatCard
                  icon={<Trophy className="h-8 w-8 text-yellow-600" />}
                  label={'N/A'}
                  value={''}
                  sublabel="Top Score"
                  loading={true}
                />
              ) : (
                <StatCard
                  icon={<Trophy className="h-8 w-8 text-yellow-600" />}
                  label={topPerformer ? topPerformer.name : 'N/A'}
                  value={topPerformer && topPerformer.score != null ? `${topPerformerScore}%` : '--'}
                  sublabel="Top Score"
                  loading={false}
                />
              )}
            </BentoCard>
            {/* Underperformer */}
            <BentoCard
              name="Underperformer"
              className="col-span-1 cursor-pointer hover:shadow-lg focus:ring-2 focus:ring-blue-500"
              background={<div className="absolute inset-0 bg-gradient-to-br from-red-100/40 to-red-300/10" />}
              Icon={ArrowDownCircle}
              description={underPerformer ? `Lowest: ${underPerformer.name}` : 'No data'}
              href={underPerformer ? `/dashboard/drivers/${underPerformer.driverId}` : '/dashboard/drivers'}
              cta="View Driver"
            >
              {loading ? (
                <StatCard
                  icon={<ArrowDownCircle className="h-8 w-8 text-red-600" />}
                  label={'N/A'}
                  value={''}
                  sublabel="Lowest Score"
                  loading={true}
                />
              ) : (
                <StatCard
                  icon={<ArrowDownCircle className="h-8 w-8 text-red-600" />}
                  label={underPerformer ? underPerformer.name : 'N/A'}
                  value={underPerformer && underPerformer.score != null ? `${underPerformerScore}%` : '--'}
                  sublabel="Lowest Score"
                  loading={false}
                />
              )}
            </BentoCard>
            {/* Performance Distribution (mini bar chart) */}
            <BentoCard
              name="Performance Distribution"
              className="col-span-2 cursor-pointer hover:shadow-lg focus:ring-2 focus:ring-blue-500"
              background={<div className="absolute inset-0 bg-gradient-to-br from-indigo-100/40 to-indigo-300/10" />}
              Icon={BarChart2}
              description="Distribution of driver grades"
              href={getGradeFilterLink('all')}
              cta="View Grades"
            >
              <div className="w-full h-40 flex items-center justify-center">
                {loading || !chartData ? (
                  <Skeleton className="h-32 w-full" />
                ) : chartData.performanceDistribution && chartData.performanceDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={chartData.performanceDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="grade" stroke="currentColor" />
                      <YAxis stroke="currentColor" />
                      <Tooltip contentStyle={{ background: 'var(--card)', color: 'var(--card-foreground)' }} />
                      <Bar dataKey="count" fill="#6366f1">
                        {chartData.performanceDistribution.map((entry: any, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            cursor="pointer"
                            tabIndex={0}
                            aria-label={`Filter drivers by grade ${entry.grade}`}
                            onClick={() => router.push(getGradeFilterLink(entry.grade))}
                            onKeyDown={e => {
                              if (e.key === 'Enter' || e.key === ' ') router.push(getGradeFilterLink(entry.grade));
                            }}
                            style={{ outline: 'none' }}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-muted-foreground text-center w-full">No data available for this period.</div>
                )}
              </div>
            </BentoCard>
            {/* Score Trend (wide card) */}
            <BentoCard
              name="Score Trend"
              className="col-span-3 cursor-pointer hover:shadow-lg focus:ring-2 focus:ring-blue-500"
              background={<div className="absolute inset-0 bg-gradient-to-br from-sky-100/40 to-sky-300/10" />}
              Icon={TrendingUp}
              description="Average driver score trend"
              href="/dashboard"
              cta="View Chart"
            >
              <div className="w-full h-56 flex items-center justify-center">
                {loading || !chartData ? (
                  <Skeleton className="h-48 w-full" />
                ) : chartData.scoreTrend && chartData.scoreTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData.scoreTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" stroke="currentColor" />
                      <YAxis stroke="currentColor" />
                      <Tooltip contentStyle={{ background: 'var(--card)', color: 'var(--card-foreground)' }} formatter={(value: any) => [`${value}%`, 'Score']} />
                      <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-muted-foreground text-center w-full">No data available for this period.</div>
                )}
              </div>
            </BentoCard>
            {/* Channel Effectiveness */}
            <BentoCard
              name="Channel Effectiveness"
              className="col-span-2 cursor-pointer hover:shadow-lg focus:ring-2 focus:ring-blue-500"
              background={<div className="absolute inset-0 bg-gradient-to-br from-teal-100/40 to-teal-300/10" />}
              Icon={MessageSquare}
              description="Alert channel response rates"
              href="/dashboard/alerts"
              cta="View Channels"
            >
              <div className="w-full flex flex-col gap-2">
                {loading || !chartData ? (
                  <Skeleton className="h-20 w-full" />
                ) : chartData.channelEffectiveness && chartData.channelEffectiveness.length > 0 ? (
                  chartData.channelEffectiveness.map((channel: any) => (
                    <div key={channel.channel} className="flex items-center justify-between">
                      <div
                        className="flex items-center gap-2 cursor-pointer hover:underline focus:ring-2 focus:ring-blue-500 outline-none"
                        tabIndex={0}
                        aria-label={`Filter alerts by channel ${channel.channel}`}
                        onClick={() => router.push(`/dashboard/alerts?type=${encodeURIComponent(channel.channel)}`)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') router.push(`/dashboard/alerts?type=${encodeURIComponent(channel.channel)}`);
                        }}
                      >
                        {channel.channel === 'WHATSAPP' && <MessageSquare className="h-5 w-5 text-green-600" />}
                        {channel.channel === 'CALL' && <Phone className="h-5 w-5 text-blue-600" />}
                        {channel.channel === 'TELEGRAM' && <Send className="h-5 w-5 text-sky-600" />}
                        <span className="font-medium text-foreground">{channel.channel}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-foreground">{channel.responseRate}%</div>
                        <div className="text-xs text-muted-foreground">{channel.responded}/{channel.sent} responded</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-muted-foreground text-center w-full">No channel data available.</div>
                )}
              </div>
            </BentoCard>
          </BentoGrid>
        </div>
      </DashboardLayout>
    </RequireAuth>
  );
} 