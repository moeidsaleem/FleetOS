import { NextRequest, NextResponse } from 'next/server'
import { UberSyncService } from '../../../../libs/uber-sync'

// Secure cron secret (set in env)
const CRON_SECRET = process.env.CRON_SECRET || 'changeme'

// Instantiate the UberSyncService (handles DB, analytics, alerts)
const uberSyncService = new UberSyncService()

/**
 * POST/GET /api/cron/uber-sync
 * Triggers a full Uber sync (drivers, analytics, scoring, alerts)
 * Requires CRON_SECRET via header or query param
 */
export async function POST(request: NextRequest) {
  // Accept token via header or query param
  const authHeader = request.headers.get('authorization')
  const url = new URL(request.url)
  const token = authHeader?.replace('Bearer ', '') || url.searchParams.get('token')

  if (!token || token !== CRON_SECRET) {
    console.warn('[CRON] Unauthorized sync attempt')
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
  }

  try {
    console.log('[CRON] Starting Uber sync (AUTO, cron)')
    const result = await uberSyncService.syncDriversFromUber('AUTO', 'cron')
    console.log('[CRON] Uber sync complete:', result)
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('[CRON] Uber sync failed:', error)
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Sync failed' }, { status: 500 })
  }
}

// Allow GET for easier testing (same logic as POST)
export const GET = POST 