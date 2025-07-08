"use client"
import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../../../components/layout/dashboard-layout';
import { RequireAuth } from '../../../../components/auth/require-auth';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export default function PerformanceAlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [driverId, setDriverId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const fetchAlerts = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (type && type !== 'all') params.append('type', type);
        if (status && status !== 'all') params.append('status', status);
        if (driverId) params.append('driverId', driverId);
        if (from) params.append('from', from);
        if (to) params.append('to', to);
        params.append('limit', '100');
        const res = await fetch(`/api/drivers/alert?${params.toString()}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to fetch alerts');
        setAlerts(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, [type, status, driverId, from, to, refresh]);

  const handleMarkRead = async (alertId: string) => {
    try {
      const res = await fetch('/api/drivers/alert', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, status: 'READ' })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update alert');
      setRefresh(r => r + 1);
    } catch (err) {
      alert('Failed to mark as read: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  return (
    <RequireAuth>
      <DashboardLayout>
        <PerformanceNav active="alerts" />
        <div className="container mx-auto py-8">
          <h1 className="text-3xl font-bold mb-6">Performance Alerts</h1>
          <div className="flex flex-wrap gap-2 mb-4">
            <input
              className="border rounded-lg px-3 py-2 w-40"
              placeholder="Driver ID"
              value={driverId}
              onChange={e => setDriverId(e.target.value)}
            />
            <select
              className="border rounded-lg px-3 py-2"
              value={type}
              onChange={e => setType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="TELEGRAM">Telegram</option>
              <option value="CALL">Voice Call</option>
              <option value="EMAIL">Email</option>
            </select>
            <select
              className="border rounded-lg px-3 py-2"
              value={status}
              onChange={e => setStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="SENT">Sent</option>
              <option value="DELIVERED">Delivered</option>
              <option value="READ">Read</option>
              <option value="FAILED">Failed</option>
            </select>
            <input
              type="date"
              className="border rounded-lg px-3 py-2 w-36"
              value={from}
              onChange={e => setFrom(e.target.value)}
            />
            <input
              type="date"
              className="border rounded-lg px-3 py-2 w-36"
              value={to}
              onChange={e => setTo(e.target.value)}
            />
            <button className="px-4 py-2 rounded-lg border bg-card text-foreground border-border" onClick={() => setRefresh(r => r + 1)}>Refresh</button>
          </div>
          {error && <div className="text-red-600 mb-4">{error}</div>}
          <div className="overflow-x-auto rounded-2xl shadow-lg bg-card border border-border">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-bold">Driver</th>
                  <th className="px-4 py-2 text-left text-xs font-bold">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-bold">Channel</th>
                  <th className="px-4 py-2 text-left text-xs font-bold">Reason</th>
                  <th className="px-4 py-2 text-left text-xs font-bold">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-bold">Message</th>
                  <th className="px-4 py-2 text-left text-xs font-bold">Created</th>
                  <th className="px-4 py-2 text-left text-xs font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-8"><Skeleton className="h-8 w-full" /></td></tr>
                ) : error ? (
                  <tr><td colSpan={8} className="text-center text-red-600 py-8">{error}</td></tr>
                ) : alerts.length === 0 ? (
                  <tr><td colSpan={8} className="text-center text-muted-foreground py-8">No alerts found.</td></tr>
                ) : (
                  alerts.map(alert => (
                    <tr key={alert.id} className="hover:bg-muted/40 transition-all">
                      <td className="px-4 py-2">
                        <div className="font-semibold">{alert.driver?.name || alert.driverId}</div>
                        <div className="text-xs text-muted-foreground">{alert.driver?.phone || ''}</div>
                      </td>
                      <td className="px-4 py-2">{alert.alertType}</td>
                      <td className="px-4 py-2">{alert.channel || alert.alertType}</td>
                      <td className="px-4 py-2">{alert.reason}</td>
                      <td className="px-4 py-2">{alert.status}</td>
                      <td className="px-4 py-2 max-w-xs truncate" title={alert.message}>{alert.message}</td>
                      <td className="px-4 py-2 text-xs">{new Date(alert.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-2">
                        {alert.status !== 'READ' && (
                          <button className="px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200" onClick={() => handleMarkRead(alert.id)}>Mark as Read</button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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