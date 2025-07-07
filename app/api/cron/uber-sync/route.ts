import { NextRequest, NextResponse } from 'next/server'
import { uberSyncService } from '../../../../libs/uber-sync'

// Set this in your environment variables
const CRON_SECRET = process.env.CRON_SECRET || 'changeme'

export async function POST(request: NextRequest) {
  // Accept token via header or query param
  const authHeader = request.headers.get('authorization')
  const url = new URL(request.url)
  const token = authHeader?.replace('Bearer ', '') || url.searchParams.get('token')

  if (!token || token !== CRON_SECRET) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const result = await uberSyncService.syncDriversFromUber('AUTO', 'cron')
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Sync failed' }, { status: 500 })
  }
}

export const GET = POST // Allow GET for easier testing 