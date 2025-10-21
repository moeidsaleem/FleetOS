"use client"

import { useState, useEffect, useCallback } from 'react'
import { DashboardLayout } from '../../../components/layout/dashboard-layout'
import { RequireAuth } from '../../../components/auth/require-auth'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { Badge } from '../../../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert'
import { Button } from '../../../components/ui/button'
import { AlertTriangle, RefreshCw, MessageSquare, Send, Phone, Mail } from 'lucide-react'
import { Input } from '../../../components/ui/input'
import { useToast } from '../../../components/ui/use-toast'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../components/ui/tooltip'
import { formatDistanceToNow } from 'date-fns'

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
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [driverId, setDriverId] = useState('')
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const [reason, setReason] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [refresh, setRefresh] = useState(0)
  const { toast } = useToast()

  const fetchAlerts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (driverId) params.append('driverId', driverId)
      if (type && type !== 'all') params.append('type', type)
      if (status && status !== 'all') params.append('status', status)
      if (reason) params.append('reason', reason)
      if (from) params.append('from', from)
      if (to) params.append('to', to)
      params.append('limit', '100')
      const res = await fetch(`/api/drivers/alert?${params.toString()}`)
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to fetch alerts')
      setAlerts(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [driverId, type, status, reason, from, to])

  useEffect(() => { fetchAlerts() }, [driverId, type, status, reason, from, to, refresh, fetchAlerts])

  const handleMarkRead = async (alertId: string) => {
    try {
      const res = await fetch('/api/drivers/alert', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, status: 'READ' })
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update alert')
      toast({ title: 'Alert marked as read', description: data.data && data.data.status ? `Status: ${data.data.status}` : undefined })
      setRefresh(r => r + 1)
    } catch (err) {
      toast({ title: 'Failed to mark as read', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mb-4">
        <Input placeholder="Driver ID" value={driverId} onChange={e => setDriverId(e.target.value)} className="w-40" />
        <Input placeholder="Reason" value={reason} onChange={e => setReason(e.target.value)} className="w-40" />
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
            <SelectItem value="TELEGRAM">Telegram</SelectItem>
            <SelectItem value="CALL">Voice Call</SelectItem>
            <SelectItem value="EMAIL">Email</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="SENT">Sent</SelectItem>
            <SelectItem value="DELIVERED">Delivered</SelectItem>
            <SelectItem value="READ">Read</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-36" />
        <Input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-36" />
        <Button variant="outline" onClick={() => setRefresh(r => r + 1)}>Refresh</Button>
      </div>
      <div className="overflow-x-auto rounded-2xl shadow-lg bg-card border border-border">
        <TooltipProvider>
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
              <th className="px-4 py-2 text-left text-xs font-bold">Triggered By</th>
              <th className="px-4 py-2 text-left text-xs font-bold">Error</th>
              <th className="px-4 py-2 text-left text-xs font-bold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="text-center py-8">Loading...</td></tr>
            ) : error ? (
              <tr><td colSpan={10} className="text-center text-red-600 py-8">{error}</td></tr>
            ) : alerts.length === 0 ? (
              <tr><td colSpan={10} className="text-center text-muted-foreground py-8">No alerts found.</td></tr>
            ) : (
              alerts.map(alert => {
                // Channel badge/icon logic
                let channelIcon = null, channelColor = 'bg-gray-200 text-gray-800'
                const channelLabel = alert.channel || alert.alertType
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
                    <td className="px-4 py-2">
                      <div className="font-semibold">{alert.driver?.name || alert.driverId}</div>
                      <div className="text-xs text-muted-foreground">{alert.driver?.phone || ''}</div>
                    </td>
                    <td className="px-4 py-2">{alert.alertType}</td>
                    <td className="px-4 py-2">
                      <button
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${channelColor} hover:underline focus:outline-none`}
                        aria-label={`Filter by channel ${channelLabel}`}
                        onClick={() => setType(channelLabel)}
                        tabIndex={0}
                      >
                        {channelIcon} {channelLabel}
                      </button>
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
                    <td className="px-4 py-2 max-w-xs truncate">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="truncate max-w-[160px] inline-block align-bottom" tabIndex={0}>{alert.message}</span>
                        </TooltipTrigger>
                        <TooltipContent>{alert.message}</TooltipContent>
                      </Tooltip>
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
                    <td className="px-4 py-2">
                      {alert.status !== 'READ' && (
                        <Button size="sm" variant="outline" onClick={() => handleMarkRead(alert.id)}>Mark as Read</Button>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
        </TooltipProvider>
      </div>
    </div>
  )
} 