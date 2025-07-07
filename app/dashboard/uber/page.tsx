"use client"

import { DashboardLayout } from '../../../components/layout/dashboard-layout';
import { RequireAuth } from '../../../components/auth/require-auth';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

function UberIntegrationDashboard() {
  const [status, setStatus] = useState<any>(null)
  const [syncStatus, setSyncStatus] = useState<any>(null)
  const [syncHistory, setSyncHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(true)
  const { toast } = useToast()
  const CRON_SECRET = process.env.NEXT_PUBLIC_CRON_SECRET || ''

  // Fetch Uber API/org status
  const fetchStatus = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/uber/status')
      const data = await res.json()
      setStatus(data)
    } catch {}
    setLoading(false)
  }
  // Fetch sync status
  const fetchSyncStatus = async () => {
    const res = await fetch('/api/settings?key=uberSyncStatus')
    const data = await res.json()
    setSyncStatus(data.data)
  }
  // Fetch sync history
  const fetchHistory = async () => {
    setHistoryLoading(true)
    const res = await fetch('/api/settings?key=uberSyncHistory')
    const data = await res.json()
    setSyncHistory(Array.isArray(data.data) ? data.data : [])
    setHistoryLoading(false)
  }
  useEffect(() => { fetchStatus(); fetchSyncStatus(); fetchHistory() }, [])

  const handleSyncNow = async () => {
    setSyncing(true)
    try {
      const res = await fetch(`/api/cron/uber-sync?token=${CRON_SECRET}`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        toast({ title: 'Uber sync started', variant: 'default' })
        fetchSyncStatus()
        fetchHistory()
      } else {
        toast({ title: 'Sync failed', description: data.error, variant: 'destructive' })
      }
    } catch (e) {
      toast({ title: 'Sync error', description: String(e), variant: 'destructive' })
    }
    setSyncing(false)
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Uber Integration</h1>
      {/* Uber API Connection Status */}
      <div className="bg-card border border-border rounded-xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            {status?.success ? <CheckCircle className="text-green-600 h-5 w-5" /> : <XCircle className="text-red-600 h-5 w-5" />}
            <span className="font-semibold">Uber API Connection:</span>
            <span className={status?.success ? 'text-green-600' : 'text-red-600'}>{status?.success ? 'Connected' : 'Not Connected'}</span>
          </div>
          {status?.org && (
            <div className="text-muted-foreground text-sm">Org: <span className="font-semibold">{status.org.name}</span> (ID: {status.org.id})</div>
          )}
          {status?.error && (
            <div className="flex items-center gap-2 text-red-600 text-sm mt-2"><AlertCircle className="h-4 w-4" /> {status.error}</div>
          )}
        </div>
        <Button onClick={handleSyncNow} disabled={syncing || loading || !status?.success} className="flex items-center gap-2">
          <RefreshCw className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Syncing...' : 'Sync Now'}
        </Button>
      </div>
      {/* Last Sync Summary & Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="font-semibold mb-1">Last Sync</div>
          {syncStatus ? (
            <div>
              <div>Status: <span className={`font-semibold ${syncStatus.status === 'SUCCESS' ? 'text-green-600' : syncStatus.status === 'FAILURE' ? 'text-red-600' : 'text-yellow-600'}`}>{syncStatus.status}</span></div>
              <div>Finished: {syncStatus.finishedAt ? new Date(syncStatus.finishedAt).toLocaleString() : 'N/A'}</div>
              <div>Processed: {syncStatus.driversProcessed} | Created: {syncStatus.driversCreated} | Updated: {syncStatus.driversUpdated}</div>
              {syncStatus.errorMessage && <div className="text-red-600 text-xs mt-1">{syncStatus.errorMessage}</div>}
            </div>
          ) : <div>No sync log found.</div>}
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="font-semibold mb-1">Quick Stats</div>
          {status?.stats ? (
            <div>
              <div>Total Drivers: <span className="font-semibold">{status.stats.totalDrivers}</span></div>
              <div>Active Drivers: <span className="font-semibold">{status.stats.activeDrivers}</span></div>
              <div>Drivers with Metrics: <span className="font-semibold">{status.stats.driversWithMetrics}</span></div>
              <div>Last Metrics: {status.stats.lastSyncTime ? new Date(status.stats.lastSyncTime).toLocaleString() : 'N/A'}</div>
            </div>
          ) : <div className="text-muted-foreground">Not available</div>}
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="font-semibold mb-1">Troubleshooting</div>
          {!status?.success ? (
            <div className="text-red-600 text-sm">Check Uber API credentials in settings.<br />See error above for details.</div>
          ) : <div className="text-green-600 text-sm">All systems operational.</div>}
        </div>
      </div>
      {/* Sync History Table */}
      <div className="mt-8">
        <h3 className="text-lg font-bold mb-2 flex items-center gap-2">Sync History {historyLoading && <RefreshCw className="animate-spin h-4 w-4" />}</h3>
        {syncHistory.length === 0 && !historyLoading ? (
          <div className="text-muted-foreground">No sync history found.</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left">Started</th>
                  <th className="px-3 py-2 text-left">Finished</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-left">Processed</th>
                  <th className="px-3 py-2 text-left">Created</th>
                  <th className="px-3 py-2 text-left">Updated</th>
                  <th className="px-3 py-2 text-left">By</th>
                  <th className="px-3 py-2 text-left">Error</th>
                </tr>
              </thead>
              <tbody>
                {syncHistory.map((log, i) => (
                  <tr key={log.id || i} className="border-b last:border-0">
                    <td className="px-3 py-2 whitespace-nowrap">{log.startedAt ? new Date(log.startedAt).toLocaleString() : ''}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{log.finishedAt ? new Date(log.finishedAt).toLocaleString() : ''}</td>
                    <td className="px-3 py-2 font-semibold">
                      <span className={
                        log.status === 'SUCCESS' ? 'text-green-600' :
                        log.status === 'FAILURE' ? 'text-red-600' :
                        'text-yellow-600'
                      }>{log.status}</span>
                    </td>
                    <td className="px-3 py-2">{log.type}</td>
                    <td className="px-3 py-2">{log.driversProcessed}</td>
                    <td className="px-3 py-2">{log.driversCreated}</td>
                    <td className="px-3 py-2">{log.driversUpdated}</td>
                    <td className="px-3 py-2">{log.createdBy || 'system'}</td>
                    <td className="px-3 py-2 text-red-600 max-w-xs truncate" title={log.errorMessage || ''}>{log.errorMessage ? log.errorMessage.slice(0, 60) : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default function UberPage() {
  return (
    <RequireAuth>
      <DashboardLayout>
        <UberIntegrationDashboard />
      </DashboardLayout>
    </RequireAuth>
  );
} 