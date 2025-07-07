"use client"

import { useState, useEffect } from 'react'
import { DashboardLayout } from '../../../components/layout/dashboard-layout'
import { RequireAuth } from '../../../components/auth/require-auth'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { Badge } from '../../../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert'
import { Button } from '../../../components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface AlertRecord {
  id: string
  driverId: string
  driverName?: string
  alertType: string
  reason: string
  status: string
  sentAt: string
  channel: string
}

export default function AlertsPage() {
  return (
    <RequireAuth>
      <DashboardLayout>
        <AlertsTable />
      </DashboardLayout>
    </RequireAuth>
  )
}

function AlertsTable() {
  const [alerts, setAlerts] = useState<AlertRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  const fetchAlerts = async () => {
    setLoading(true)
    setError(null)
    try {
      // Try /api/drivers/alert, fallback to /api/alerts if needed
      const res = await fetch('/api/drivers/alert?limit=100')
      if (!res.ok) throw new Error('Failed to fetch alerts')
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Invalid response')
      // Normalize data
      setAlerts((data.data || []).map((a: any) => ({
        id: a.id,
        driverId: a.driverId,
        driverName: a.driverName || a.driver?.name || '',
        alertType: a.alertType || a.type || '',
        reason: a.reason || '',
        status: a.status || '',
        sentAt: a.sentAt || a.createdAt || '',
        channel: a.channel || a.alertType || '',
      })))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAlerts() }, [])

  const filteredAlerts = alerts.filter(a =>
    (statusFilter === 'all' || a.status === statusFilter) &&
    (typeFilter === 'all' || a.alertType === typeFilter)
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Alerts</h1>
          <p className="text-muted-foreground">View and manage all driver alerts.</p>
        </div>
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="SENT">Sent</SelectItem>
              <SelectItem value="DELIVERED">Delivered</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
              <SelectItem value="READ">Read</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
              <SelectItem value="TELEGRAM">Telegram</SelectItem>
              <SelectItem value="CALL">Voice Call</SelectItem>
              <SelectItem value="EMAIL">Email</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchAlerts} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="overflow-x-auto rounded-2xl shadow-lg bg-card border border-border">
        <Table className="min-w-full divide-y divide-border">
          <TableHeader className="bg-gradient-to-r from-orange-50 via-background to-pink-50 dark:from-orange-950 dark:via-background dark:to-pink-950">
            <TableRow>
              <TableHead className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Driver</TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Type</TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Reason</TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Sent At</TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Channel</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i} className="animate-pulse">
                  <TableCell className="px-6 py-4"><div className="h-4 bg-muted rounded w-3/4" /></TableCell>
                  <TableCell className="px-6 py-4"><div className="h-4 bg-muted rounded w-1/2" /></TableCell>
                  <TableCell className="px-6 py-4"><div className="h-4 bg-muted rounded w-1/2" /></TableCell>
                  <TableCell className="px-6 py-4"><div className="h-4 bg-muted rounded w-1/4" /></TableCell>
                  <TableCell className="px-6 py-4"><div className="h-4 bg-muted rounded w-1/4" /></TableCell>
                  <TableCell className="px-6 py-4"><div className="h-4 bg-muted rounded w-1/4" /></TableCell>
                </TableRow>
              ))
            ) : filteredAlerts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-12 text-lg">No alerts found.</TableCell>
              </TableRow>
            ) : (
              filteredAlerts.map(alert => (
                <TableRow key={alert.id} className="hover:bg-muted/40 dark:hover:bg-muted/20 transition-all">
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <span className="font-bold text-foreground">{alert.driverName || alert.driverId}</span>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="secondary" className="text-xs">{alert.alertType}</Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <span className="text-foreground">{alert.reason}</span>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={alert.status === 'FAILED' ? 'destructive' : alert.status === 'DELIVERED' || alert.status === 'READ' ? 'default' : 'secondary'} className="text-xs">
                      {alert.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <span className="text-muted-foreground text-xs">{alert.sentAt ? new Date(alert.sentAt).toLocaleString() : ''}</span>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="outline" className="text-xs">{alert.channel}</Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 