"use client"
import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../../../components/layout/dashboard-layout';
import { RequireAuth } from '../../../../components/auth/require-auth';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export default function TopPerformersPage() {
  const [topPerformers, setTopPerformers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/dashboard/stats');
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to fetch stats');
        setTopPerformers(data.data.topPerformers || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <RequireAuth>
      <DashboardLayout>
        <PerformanceNav active="top" />
        <div className="container mx-auto py-8">
          <h1 className="text-3xl font-bold mb-6">Top Performers</h1>
          {error && <div className="text-red-600 mb-4">{error}</div>}
          {loading ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border mb-6">
              <table className="min-w-full divide-y divide-border">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-bold">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-bold">Score</th>
                    <th className="px-4 py-2 text-left text-xs font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {topPerformers.length === 0 ? (
                    <tr><td colSpan={3} className="text-muted-foreground py-8 text-center">No top performers found.</td></tr>
                  ) : (
                    topPerformers.map(driver => (
                      <tr key={driver.driverId} className="hover:bg-muted/40 transition-all">
                        <td className="px-4 py-2 font-semibold">
                          <Link href={`/dashboard/drivers/${driver.driverId}`} className="hover:underline text-blue-600">{driver.name}</Link>
                        </td>
                        <td className="px-4 py-2 text-lg font-bold">{Math.round((driver.score || 0) * 100)}%</td>
                        <td className="px-4 py-2">
                          <button className="px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200">Send Congrats</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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