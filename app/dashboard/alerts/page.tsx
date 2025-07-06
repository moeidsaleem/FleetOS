import { DashboardLayout } from '../../../components/layout/dashboard-layout';
import { RequireAuth } from '../../../components/auth/require-auth';

export default function AlertsPage() {
  return (
    <RequireAuth>
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Alerts</h1>
          <p className="text-muted-foreground">This page is under construction.</p>
        </div>
      </DashboardLayout>
    </RequireAuth>
  );
} 