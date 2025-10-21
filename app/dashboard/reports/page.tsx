"use client"

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ReportsClient } from '@/components/reports/reports-client'
import { RequireAuth } from '@/components/auth/require-auth'
import React from 'react'

export default function ProtectedReportsPage() {
  return (
    <RequireAuth>
      <DashboardLayout>
        <ReportsPage />
      </DashboardLayout>
    </RequireAuth>
  )
}

function ReportsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reports</h1>
      <p className="text-muted-foreground">
        Request and manage your offline reports from Uber.
      </p>
      <ReportsClient />
    </div>
  )
} 