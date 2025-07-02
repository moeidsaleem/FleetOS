'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Download } from 'lucide-react'

interface Report {
  id: string
  fileName: string
  status: string
  createdAt: string
}

export function OfflineReportRequester() {
  const { toast } = useToast()
  const [reportType, setReportType] = useState('REPORT_TYPE_DRIVER_QUALITY')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [requestedReports, setRequestedReports] = useState<Report[]>([])

  useEffect(() => {
    const storedReports = localStorage.getItem('requestedReports')
    if (storedReports) {
      setRequestedReports(JSON.parse(storedReports))
    }
  }, [])

  useEffect(() => {
    if (requestedReports.length > 0) {
      localStorage.setItem('requestedReports', JSON.stringify(requestedReports))
    }
  }, [requestedReports])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (!startDate || !endDate) {
      toast({
        title: 'Error',
        description: 'Please select both a start and end date.',
        variant: 'destructive',
      })
      setIsLoading(false)
      return
    }

    const startTimestamp = new Date(startDate).getTime().toString()
    const endTimestamp = new Date(endDate).getTime().toString()

    try {
      const response = await fetch('/api/reports/offline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType,
          filters: [
            {
              field: 'dateRange',
              operator: 'OPERATOR_IN_RANGE',
              value: [startTimestamp, endTimestamp],
            },
          ],
        }),
      })

      const result = await response.json()

      if (response.ok) {
        const newReport: Report = {
          id: result.data.report.id,
          fileName: result.data.report.fileName,
          status: result.data.report.status,
          createdAt: result.data.report.createdAt,
        }
        setRequestedReports(prev => [newReport, ...prev])
        toast({
          title: 'Success',
          description: `Report request submitted successfully.`,
        })
      } else {
        throw new Error(result.error || 'Failed to request report')
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefreshStatus = async (reportId: string) => {
    try {
      const response = await fetch(`/api/reports/offline/${reportId}`)
      const result = await response.json()
      if (response.ok) {
        setRequestedReports(prev =>
          prev.map(r => (r.id === reportId ? { ...r, status: result.data.report.status } : r))
        )
        toast({
          title: 'Status Updated',
          description: `Report ${reportId} is now ${result.data.report.status}.`,
        })
      } else {
        throw new Error(result.error || 'Failed to refresh status')
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const handleDownload = async (reportId: string) => {
    try {
      const response = await fetch(`/api/reports/offline/${reportId}/download`)
      const result = await response.json()
      if (response.ok && result.data.downloadUrl) {
        window.open(result.data.downloadUrl, '_blank')
      } else {
        throw new Error(result.error || 'Could not get download URL')
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'REPORT_STATUS_COMPLETED':
        return 'default'
      case 'REPORT_STATUS_FAILED':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Request Offline Report</CardTitle>
          <CardDescription>Request a new report to be generated asynchronously.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reportType">Report Type</Label>
              <Input
                id="reportType"
                value={reportType}
                onChange={e => setReportType(e.target.value)}
                disabled
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Requesting...' : 'Request Report'}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {requestedReports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Requested Reports</CardTitle>
            <CardDescription>View the status of your requested reports.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requestedReports.map(report => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.fileName}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(report.status)}>
                        {report.status.replace('REPORT_STATUS_', '')}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(report.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="icon" onClick={() => handleRefreshStatus(report.id)}>
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      {report.status === 'REPORT_STATUS_COMPLETED' && (
                        <Button variant="outline" size="icon" onClick={() => handleDownload(report.id)}>
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 