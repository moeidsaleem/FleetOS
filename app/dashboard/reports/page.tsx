import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ReportsClient } from '@/components/reports/reports-client'

export default function ReportsPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground">
          Request and manage your offline reports from Uber.
        </p>
        <ReportsClient />
      </div>
    </DashboardLayout>
  )
} 