"use client"
import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../../../components/layout/dashboard-layout';
import { RequireAuth } from '../../../../components/auth/require-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from 'recharts';
import Link from 'next/link';

export default function TrendsPage() {
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/dashboard/charts?timeRange=${timeRange}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to fetch chart data');
        setChartData(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [timeRange]);

  return (
    <RequireAuth>
      <DashboardLayout>
        <PerformanceNav active="trends" />
        <div className="container mx-auto py-8">
          <h1 className="text-3xl font-bold mb-6">Performance Trends</h1>
          <div className="flex gap-2 mb-6">
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
          {error && <div className="text-red-600 mb-4">{error}</div>}
          {loading || !chartData ? (
            <Skeleton className="h-64 w-full mb-8" />
          ) : (
            <div className="space-y-12">
              {/* Score Trend */}
              <div>
                <h2 className="text-xl font-semibold mb-2">Score Trend</h2>
                {chartData.scoreTrend && chartData.scoreTrend.length > 0 ? (
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
                  <div className="text-muted-foreground">No score trend data available.</div>
                )}
              </div>
              {/* Alert Trend */}
              <div>
                <h2 className="text-xl font-semibold mb-2">Alert Frequency</h2>
                {chartData.alertTrend && chartData.alertTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData.alertTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" stroke="currentColor" />
                      <YAxis stroke="currentColor" />
                      <Tooltip contentStyle={{ background: 'var(--card)', color: 'var(--card-foreground)' }} />
                      <Bar dataKey="alerts" fill="#f59e42" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-muted-foreground">No alert trend data available.</div>
                )}
              </div>
              {/* Performance Distribution */}
              <div>
                <h2 className="text-xl font-semibold mb-2">Performance Distribution</h2>
                {chartData.performanceDistribution && chartData.performanceDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={chartData.performanceDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="grade" stroke="currentColor" />
                      <YAxis stroke="currentColor" />
                      <Tooltip contentStyle={{ background: 'var(--card)', color: 'var(--card-foreground)' }} />
                      <Bar dataKey="count" fill="#6366f1">
                        {chartData.performanceDistribution.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-muted-foreground">No performance distribution data available.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </RequireAuth>
  );
}

function PerformanceNav({ active }: { active: string }) {
  const nav = [
    { name: 'Overview', href: '/dashboard/performance' },
    { name: 'Grades', href: '/dashboard/performance/grades' },
    { name: 'Trends', href: '/dashboard/performance/trends' },
    { name: 'Alerts', href: '/dashboard/performance/alerts' },
    { name: 'Top', href: '/dashboard/performance/top' },
    { name: 'Underperformers', href: '/dashboard/performance/underperformers' },
  ];
  return (
    <nav className="flex gap-2 mb-8">
      {nav.map(item => (
        <Link
          key={item.href}
          href={item.href}
          className={`px-4 py-2 rounded-lg border ${active === item.name.toLowerCase() ? 'bg-blue-600 text-white' : 'bg-card text-foreground border-border'} transition`}
        >
          {item.name}
        </Link>
      ))}
    </nav>
  );
} 