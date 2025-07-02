'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Download } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const PERFORMANCE_REPORTS = [
  'REPORT_TYPE_DRIVER_QUALITY',
  'REPORT_TYPE_DRIVER_SESSION',
  'REPORT_TYPE_DRIVER_PERFORMANCE',
  'REPORT_TYPE_FLEET_PERFORMANCE',
]

const PAYMENT_REPORTS = [
  'REPORT_TYPE_PAYMENT_TRANSACTIONS_EARNINGS',
  'REPORT_TYPE_PAYMENT_TRANSACTIONS_FEES',
  'REPORT_TYPE_PAYMENT_STATEMENT',
  'REPORT_TYPE_PAYMENT_SUMMARY',
]

interface Report {
  id: string
  fileName: string | null
  status: string | null
  createdAt: string | null
  reportType: string | null
  downloadUrl?: string | null
}

const transformReport = (apiReport: any): Report => ({
  id: apiReport.id,
  fileName: apiReport.fileName || apiReport.file_name,
  status: apiReport.status,
  createdAt: apiReport.createdAt || apiReport.created_at,
  reportType: apiReport.reportType || apiReport.report_type,
  downloadUrl: apiReport.downloadUrl || apiReport.download_url,
});

export function ReportsClient() {
  const { toast } = useToast()
  const [reportType, setReportType] = useState('REPORT_TYPE_DRIVER_QUALITY')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [reports, setReports] = useState<Report[]>([])
  const [refreshingId, setRefreshingId] = useState<string | null>(null)
  const [isAutoFetching, setIsAutoFetching] = useState(false)

  const fetchReports = useCallback(async () => {
    try {
      const response = await fetch('/api/reports/offline')
      const result = await response.json()
      if (response.ok && result.data.reports) {
        setReports(result.data.reports.map(transformReport))
      } else {
        throw new Error(result.error || 'Failed to fetch reports')
      }
    } catch (error: any) {
      toast({
        title: 'Error Fetching Reports',
        description: error.message,
        variant: 'destructive',
      })
    }
  }, [toast])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  useEffect(() => {
    const reportsThatNeedDetails = reports.filter(
      r => r.status === 'REPORT_STATUS_COMPLETED' && !r.downloadUrl
    );

    if (reportsThatNeedDetails.length > 0 && !isAutoFetching) {
      const fetchDetails = async () => {
        setIsAutoFetching(true);
        for (const report of reportsThatNeedDetails) {
          await handleRefreshStatus(report.id, false); // isManual = false
          await new Promise(resolve => setTimeout(resolve, 500)); // Delay
        }
        setIsAutoFetching(false);
      };
      fetchDetails();
    }
  }, [reports, isAutoFetching]);

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
          report_type: reportType,
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
        toast({
          title: 'Success',
          description: `Report request submitted successfully.`,
        })
        await fetchReports()
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

  const handleDownload = (url: string | null | undefined) => {
    if (url) {
      window.open(url, '_blank', 'noreferrer');
    } else {
      toast({
        title: 'Error',
        description: 'Download URL is not available for this report.',
        variant: 'destructive',
      })
    }
  };

  const handleRefreshStatus = useCallback(async (reportId: string, isManual = true) => {
    if (isManual) {
      setRefreshingId(reportId)
    }
    try {
      // First, get the latest status
      const statusResponse = await fetch(`/api/reports/offline/${reportId}`)
      const statusResult = await statusResponse.json()

      if (!statusResponse.ok) {
        throw new Error(statusResult.error || 'Failed to refresh status')
      }
      
      const updatedReport = transformReport(statusResult.data.report);
      setReports(prev => prev.map(r => (r.id === reportId ? updatedReport : r)));

      // If completed, create and fetch the download URL
      if (updatedReport.status === 'REPORT_STATUS_COMPLETED') {
        const downloadResponse = await fetch(`/api/reports/offline/${reportId}/download`, { method: 'POST' });
        const downloadResult = await downloadResponse.json();

        if (downloadResponse.ok) {
          setReports(prev =>
            prev.map(r =>
              r.id === reportId
                ? { ...r, downloadUrl: downloadResult.data.download_url }
                : r
            )
          );
        } else {
          throw new Error(downloadResult.error || 'Failed to create download URL');
        }
      }

      if (isManual) {
        toast({
          title: 'Status Updated',
          description: `Report ${reportId} is now ${updatedReport.status}.`,
        })
      }
    } catch (error: any) {
      if (isManual) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        })
      } else {
        console.error(`Auto-refresh for ${reportId} failed:`, error)
      }
    } finally {
      if (isManual) {
        setRefreshingId(null)
      }
    }
  }, [toast])

  useEffect(() => {
    const reportsThatNeedDetails = reports.filter(
      r => r.status === 'REPORT_STATUS_COMPLETED' && !r.downloadUrl
    );

    if (reportsThatNeedDetails.length > 0 && !isAutoFetching) {
      const fetchDetails = async () => {
        setIsAutoFetching(true);
        for (const report of reportsThatNeedDetails) {
          await handleRefreshStatus(report.id, false); // isManual = false
          await new Promise(resolve => setTimeout(resolve, 500)); // Delay
        }
        setIsAutoFetching(false);
      };
      fetchDetails();
    }
  }, [reports, isAutoFetching, handleRefreshStatus]);

  const getStatusVariant = (status: string | null) => {
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
          <CardTitle>Request New Report</CardTitle>
          <CardDescription>Request a new report to be generated asynchronously.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reportType">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a report type" />
                </SelectTrigger>
                <SelectContent>
                    <Label className="px-2 text-xs text-muted-foreground">Performance</Label>
                    {PERFORMANCE_REPORTS.map(type => (
                      <SelectItem key={type} value={type}>{type.replace('REPORT_TYPE_', '').replace(/_/g, ' ')}</SelectItem>
                    ))}
                    <Label className="px-2 text-xs text-muted-foreground">Payments</Label>
                    {PAYMENT_REPORTS.map(type => (
                      <SelectItem key={type} value={type}>{type.replace('REPORT_TYPE_', '').replace(/_/g, ' ')}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
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
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map(report => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.fileName || 'N/A'}</TableCell>
                  <TableCell>{report.reportType?.replace('REPORT_TYPE_', '').replace(/_/g, ' ') || 'Unknown'}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(report.status)}>
                      {report.status?.replace('REPORT_STATUS_', '') || 'UNKNOWN'}
                    </Badge>
                  </TableCell>
                  <TableCell>{report.createdAt ? new Date(report.createdAt).toLocaleString() : 'N/A'}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleRefreshStatus(report.id, true)}
                            disabled={refreshingId === report.id}
                          >
                            {refreshingId === report.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Refresh Status</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    {report.status === 'REPORT_STATUS_COMPLETED' && report.downloadUrl && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" onClick={() => handleDownload(report.downloadUrl)}>
                              <Download className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Download Report</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 