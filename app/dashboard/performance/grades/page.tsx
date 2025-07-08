"use client"
import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../../../components/layout/dashboard-layout';
import { RequireAuth } from '../../../../components/auth/require-auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

const GRADES = [
  'A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'
];

function getGrade(score: number): string {
  if (score >= 0.95) return 'A+';
  if (score >= 0.9) return 'A';
  if (score >= 0.85) return 'B+';
  if (score >= 0.8) return 'B';
  if (score >= 0.75) return 'C+';
  if (score >= 0.7) return 'C';
  if (score >= 0.6) return 'D';
  return 'F';
}

export default function GradesPage() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchDrivers = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.append('limit', '200');
        if (search) params.append('search', search);
        if (status) params.append('status', status);
        const res = await fetch(`/api/drivers?${params.toString()}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to fetch drivers');
        setDrivers(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchDrivers();
  }, [search, status]);

  // Group drivers by grade
  const driversByGrade: Record<string, any[]> = {};
  for (const grade of GRADES) driversByGrade[grade] = [];
  for (const driver of drivers) {
    const score = driver.currentScore || 0;
    const grade = getGrade(score);
    driversByGrade[grade].push(driver);
  }

  return (
    <RequireAuth>
      <DashboardLayout>
        <PerformanceNav active="grades" />
        <div className="container mx-auto py-8">
          <h1 className="text-3xl font-bold mb-6">Driver Grades</h1>
          <div className="flex gap-2 mb-4">
            <input
              className="border rounded-lg px-3 py-2 w-64"
              placeholder="Search by name, email, phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              className="border rounded-lg px-3 py-2"
              value={status}
              onChange={e => setStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
          {error && <div className="text-red-600 mb-4">{error}</div>}
          {loading ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <div className="space-y-8">
              {GRADES.map(grade => (
                <div key={grade}>
                  <h2 className="text-2xl font-semibold mb-2">Grade {grade} <span className="text-muted-foreground text-base">({driversByGrade[grade].length})</span></h2>
                  {driversByGrade[grade].length === 0 ? (
                    <div className="text-muted-foreground mb-4">No drivers in this grade.</div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-border mb-6">
                      <table className="min-w-full divide-y divide-border">
                        <thead>
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-bold">Name</th>
                            <th className="px-4 py-2 text-left text-xs font-bold">Score</th>
                            <th className="px-4 py-2 text-left text-xs font-bold">Status</th>
                            <th className="px-4 py-2 text-left text-xs font-bold">Alerts</th>
                            <th className="px-4 py-2 text-left text-xs font-bold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {driversByGrade[grade].map(driver => (
                            <tr key={driver.id} className="hover:bg-muted/40 transition-all">
                              <td className="px-4 py-2 font-semibold">
                                <Link href={`/dashboard/drivers/${driver.id}`} className="hover:underline text-blue-600">{driver.name}</Link>
                                <div className="text-xs text-muted-foreground">{driver.email || driver.phoneNumber}</div>
                              </td>
                              <td className="px-4 py-2 text-lg font-bold">{Math.round((driver.currentScore || 0) * 100)}%</td>
                              <td className="px-4 py-2">{driver.status}</td>
                              <td className="px-4 py-2">{driver.recentAlertsCount || 0}</td>
                              <td className="px-4 py-2">
                                <Link href={`/dashboard/drivers/${driver.id}`} className="text-blue-600 hover:underline">View</Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
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