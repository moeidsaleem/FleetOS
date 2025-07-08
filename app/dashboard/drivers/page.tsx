'use client'

import { useState, useEffect } from 'react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert'
import { useToast } from '../../../components/ui/use-toast'
import { Plus, AlertTriangle } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { Badge } from '../../../components/ui/badge'
import { AlertCallModal } from '../../../components/ui/alert-call-modal'
import { RefreshCw } from 'lucide-react'
import { RequireAuth } from '../../../components/auth/require-auth'
import React from 'react'
import { DashboardLayout } from '../../../components/layout/dashboard-layout'
import Link from 'next/link'
import { Dialog, DialogContent, DialogFooter } from '../../../components/ui/dialog'
import Papa, { ParseResult, ParseError } from 'papaparse'
import { getGradeFromScore } from '../../../libs/driver-scoring'

interface Driver {
  id: string
  name: string
  phoneNumber: string
  language?: 'ENGLISH' | 'ARABIC' | 'HINDI' | 'URDU' | 'FRENCH' | 'RUSSIAN' | 'TAGALOG' | 'SPANISH'
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  uberDriverId?: string
  createdAt: string
  currentScore?: number
  recentAlertsCount?: number
  lastMetricDate?: string
  lastMetrics?: {
    calculatedScore: number
    acceptanceRate: number
    cancellationRate: number
    completionRate: number
    feedbackScore: number
    tripVolume: number
    idleRatio: number
    grade: string
  }
  alertCount?: number
}

// Hook for debounced search
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export default function ProtectedDriversPage(props: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <RequireAuth>
      <DashboardLayout>
        <DriversPage {...props} />
      </DashboardLayout>
    </RequireAuth>
  )
}

export function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [gradeFilter, setGradeFilter] = useState<string>('all')
  const [languageFilter, setLanguageFilter] = useState<string>('all')
  const { toast } = useToast()
  const [alertCallModal, setAlertCallModal] = useState<{
    open: boolean
    driver: Driver | null
  }>({
    open: false,
    driver: null
  })
  const [importOpen, setImportOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importPreview, setImportPreview] = useState<any[]>([])
  const [importErrors, setImportErrors] = useState<string[]>([])
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<any | null>(null)

  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const fetchDrivers = async (syncFromUber = false) => {
    try {
      setLoading(true)
      setError(null)
      
      if (syncFromUber) {
        toast({
          title: "Syncing with Uber Fleet API",
          description: "Fetching latest driver data...",
        })
      }
      
      // Always fetch only drivers, not alerts
      const url = `/api/drivers?limit=1000`
      console.log('Fetching drivers from:', url)
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Failed to fetch drivers')
      }

      const data = await response.json()
      console.log('API response:', data)
      
      if (!data.success) {
        throw new Error(data.error || 'Invalid response from server')
      }

      // Show sync result toast if present
      if (syncFromUber && data.syncResult) {
        if (data.syncResult.success) {
          toast({
            title: 'Uber Sync Complete! ✅',
            description: `Processed: ${data.syncResult.driversProcessed}, Created: ${data.syncResult.driversCreated}, Updated: ${data.syncResult.driversUpdated}`,
          })
        } else {
          toast({
            title: 'Uber Sync Failed',
            description: data.syncResult.error || (data.syncResult.errors && data.syncResult.errors.join(', ')) || 'Unknown error',
            variant: 'destructive',
          })
        }
      }

      console.log('Raw drivers data:', data.data)

      // Use real data without mock enrichment
      const driversWithMetrics = data.data.map((driver: any) => ({
        ...driver,
        phoneNumber: driver.phone || driver.phoneNumber || '', // Ensure phoneNumber is always present
        lastMetrics: driver.lastMetrics || {
          calculatedScore: driver.currentScore || 0,
          acceptanceRate: 0,
          cancellationRate: 0,
          completionRate: 0,
          feedbackScore: 0,
          tripVolume: 0,
          idleRatio: 0,
          grade: getGradeFromScore(driver.currentScore || 0)
        },
        alertCount: driver.recentAlertsCount || 0
      }))

      console.log('Processed drivers:', driversWithMetrics)
      
      setDrivers(driversWithMetrics)
      
      if (syncFromUber) {
        toast({
          title: "Sync Complete! ✅",
          description: `Updated ${driversWithMetrics.length} drivers from Uber Fleet API.`,
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      toast({
        title: "Error Loading Drivers",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDrivers()
  }, [])

  const getGradeBadgeVariant = (grade: string) => {
    if (['A+', 'A'].includes(grade)) return 'default'
    if (['B+', 'B'].includes(grade)) return 'secondary'
    if (['C+', 'C'].includes(grade)) return 'outline'
    return 'destructive'
  }

  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = (driver.name && driver.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
                         (driver.phoneNumber && driver.phoneNumber.includes(debouncedSearchTerm)) ||
                         (driver.uberDriverId && driver.uberDriverId.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || driver.status === statusFilter
    const matchesGrade = gradeFilter === 'all' || driver.lastMetrics?.grade === gradeFilter
    const matchesLanguage = languageFilter === 'all' || driver.language === languageFilter
    
    return matchesSearch && matchesStatus && matchesGrade && matchesLanguage
  })

  // Export handler (now implemented)
  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await fetch('/api/drivers/export')
      if (!res.ok) throw new Error('Failed to export drivers')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'drivers-export.csv'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      toast({ title: 'Export failed', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' })
    } finally {
      setExporting(false)
    }
  }

  // Handle file selection and parse CSV
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setImportFile(file)
    setImportErrors([])
    setImportPreview([])
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results: ParseResult<any>) => {
          if (results.errors.length > 0) {
            setImportErrors(results.errors.map((e: ParseError) => e.message))
          } else {
            setImportPreview(results.data as any[])
          }
        }
      })
    }
  }

  const handleImport = async () => {
    if (!importFile) return
    setImporting(true)
    setImportResult(null)
    setImportErrors([])
    try {
      const formData = new FormData()
      formData.append('file', importFile)
      const res = await fetch('/api/drivers/import', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setImportErrors([data.error || 'Import failed'])
        setImportResult(null)
        toast({ title: 'Import failed', description: data.error || 'Import failed', variant: 'destructive' })
      } else {
        setImportResult(data)
        toast({ title: 'Import complete', description: `${data.successCount} drivers imported, ${data.errorCount} errors.`, variant: 'default' })
        fetchDrivers()
      }
    } catch (err) {
      setImportErrors(['Import failed'])
      setImportResult(null)
      toast({ title: 'Import failed', description: 'Import failed', variant: 'destructive' })
    } finally {
      setImporting(false)
    }
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Drivers</AlertTitle>
          <AlertDescription className="mt-2">
            {error}
            <div className="flex gap-2 mt-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => fetchDrivers()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-4xl font-extrabold text-black drop-shadow-lg dark:text-white tracking-tight mb-1">Drivers</h1>
          <p className="text-muted-foreground text-lg">Manage your fleet drivers, performance, and alerts.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <Input
            placeholder="Search drivers..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="rounded-xl bg-background border border-border shadow-inner focus:ring-2 focus:ring-blue-200 min-w-[220px] text-foreground placeholder:text-muted-foreground dark:bg-background dark:border-border"
          />
          <Button variant="outline" className="font-semibold" onClick={() => setImportOpen(true)}>
            Bulk Import
          </Button>
          <Button variant="outline" className="font-semibold" onClick={handleExport} disabled={exporting}>
            {exporting ? 'Exporting...' : 'Export'}
          </Button>
          <Link href="/dashboard/drivers/add" passHref >
            <Button asChild className="bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg shadow-md px-6 py-2">
              <div><Plus className="h-4 w-4 mr-2" /> Add Driver</div>
            </Button>
          </Link>
        </div>
      </div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6 bg-card rounded-xl p-4 shadow-sm border border-border dark:bg-card dark:border-border">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 rounded-lg bg-background text-foreground dark:bg-background">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
          </SelectContent>
        </Select>
        <Select value={gradeFilter} onValueChange={setGradeFilter}>
          <SelectTrigger className="w-36 rounded-lg bg-background text-foreground dark:bg-background">
            <SelectValue placeholder="Grade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Grades</SelectItem>
            <SelectItem value="A+">A+</SelectItem>
            <SelectItem value="A">A</SelectItem>
            <SelectItem value="B+">B+</SelectItem>
            <SelectItem value="B">B</SelectItem>
            <SelectItem value="C+">C+</SelectItem>
            <SelectItem value="C">C</SelectItem>
            <SelectItem value="D">D</SelectItem>
            <SelectItem value="F">F</SelectItem>
          </SelectContent>
        </Select>
        <Select value={languageFilter} onValueChange={setLanguageFilter}>
          <SelectTrigger className="w-36 rounded-lg bg-background text-foreground dark:bg-background">
            <SelectValue placeholder="Language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Languages</SelectItem>
            <SelectItem value="ENGLISH">English</SelectItem>
            <SelectItem value="ARABIC">Arabic</SelectItem>
            <SelectItem value="HINDI">Hindi</SelectItem>
            <SelectItem value="URDU">Urdu</SelectItem>
            <SelectItem value="FRENCH">French</SelectItem>
            <SelectItem value="RUSSIAN">Russian</SelectItem>
            <SelectItem value="TAGALOG">Tagalog</SelectItem>
            <SelectItem value="SPANISH">Spanish</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {/* Driver List Table */}
      <div className="overflow-x-auto rounded-2xl shadow-lg bg-card border border-border dark:bg-card dark:border-border">
        <Table className="min-w-full divide-y divide-border dark:divide-border">
          <TableHeader className="bg-gradient-to-r from-blue-50 via-background to-purple-50 dark:from-blue-950 dark:via-background dark:to-purple-950">
            <TableRow>
              <TableHead className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Driver</TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Performance</TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Grade</TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Alerts</TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</TableHead>
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
            ) : filteredDrivers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-12 text-lg">No drivers found.</TableCell>
              </TableRow>
            ) : (
              filteredDrivers.map(driver => (
                <TableRow key={driver.id} className="hover:bg-muted/40 dark:hover:bg-muted/20 transition-all">
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <div className="font-bold text-foreground">{driver.name}</div>
                    <div className="text-xs text-muted-foreground">{driver.phoneNumber}</div>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={driver.status === 'ACTIVE' ? 'default' : driver.status === 'SUSPENDED' ? 'destructive' : 'secondary'} className="text-xs">
                      {driver.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    {driver.lastMetrics ? (
                      <span className="font-semibold text-blue-700 dark:text-blue-300">{Math.round(driver.lastMetrics.calculatedScore * 100)}%</span>
                    ) : (
                      <span className="text-muted-foreground">--</span>
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    {driver.lastMetrics ? (
                      <Badge variant={getGradeBadgeVariant(getGradeFromScore(driver.lastMetrics.calculatedScore || 0))} className="text-xs">
                        {getGradeFromScore(driver.lastMetrics.calculatedScore || 0)}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">--</span>
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    {driver.alertCount && driver.alertCount > 0 ? (
                      <Badge variant="destructive" className="text-xs font-semibold">
                        {driver.alertCount}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">None</span>
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap flex gap-2">
                    <Button size="sm" variant="outline" className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-semibold hover:text-white" onClick={() => setAlertCallModal({ open: true, driver })}>
                      Alert
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-lg bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white font-semibold hover:text-white" asChild>
                      <a href={`/dashboard/drivers/${driver.id}`}>View</a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {/* Restore AlertCallModal at the bottom */}
      {alertCallModal.driver && (
        <AlertCallModal
          open={alertCallModal.open}
          onOpenChange={open => setAlertCallModal({ open, driver: open ? alertCallModal.driver : null })}
          driver={alertCallModal.driver}
        />
      )}
      {/* Bulk Import Modal */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent>
          <h2 className="text-xl font-bold mb-2">Bulk Import Drivers</h2>
          <p className="text-muted-foreground mb-4">Upload a CSV file to add multiple drivers at once. <br />Download a <a href="/driver-import-template.csv" download className="text-blue-600 underline">template</a>.</p>
          <input type="file" accept=".csv" className="mb-4" onChange={handleImportFile} disabled={importing} />
          {importErrors.length > 0 && (
            <div className="mb-2 text-red-600 text-sm">
              {importErrors.map((err, i) => <div key={i}>{err}</div>)}
            </div>
          )}
          {importPreview.length > 0 && (
            <div className="mb-2 max-h-40 overflow-auto border rounded bg-muted/30 p-2 text-xs">
              <div className="font-semibold mb-1">Preview ({importPreview.length} rows):</div>
              <table className="w-full">
                <thead><tr>{Object.keys(importPreview[0]).map((k) => <th key={k} className="px-1 text-left">{k}</th>)}</tr></thead>
                <tbody>
                  {importPreview.slice(0, 5).map((row, i) => (
                    <tr key={i}>{Object.values(row).map((v, j) => <td key={j} className="px-1">{v as string}</td>)}</tr>
                  ))}
                </tbody>
              </table>
              {importPreview.length > 5 && <div className="text-muted-foreground">...and {importPreview.length - 5} more rows</div>}
            </div>
          )}
          {importResult && (
            <div className="mb-2 text-xs">
              <div className="font-semibold mb-1">Import Summary:</div>
              <div className="mb-1">✅ {importResult.successCount} imported, ❌ {importResult.errorCount} errors</div>
              {importResult.results && importResult.results.length > 0 && (
                <div className="max-h-32 overflow-auto border rounded bg-muted/30 p-2">
                  <table className="w-full">
                    <thead><tr><th>#</th><th>Status</th><th>Error</th></tr></thead>
                    <tbody>
                      {importResult.results.slice(0, 10).map((r: any, i: number) => (
                        <tr key={i}>
                          <td>{i + 1}</td>
                          <td>{r.success ? '✅' : '❌'}</td>
                          <td className="text-red-600">{r.error || ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {importResult.results.length > 10 && <div className="text-muted-foreground">...and {importResult.results.length - 10} more rows</div>}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)} disabled={importing}>Cancel</Button>
            <Button disabled={!importFile || importErrors.length > 0 || importing} onClick={handleImport}>
              {importing ? 'Importing...' : 'Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 