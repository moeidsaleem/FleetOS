import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { getUberAPI } = await import('../../../libs/uber-api')
    const { uberSyncService } = await import('../../../libs/uber-sync')
    const uberAPI = getUberAPI()
    let org = null
    let stats = null
    let success = false
    let error = null
    try {
      org = await uberAPI.getOrganization()
      stats = await uberSyncService.getSyncSummary()
      success = true
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to connect to Uber API'
    }
    return NextResponse.json({ success, org, stats, error })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Internal error' }, { status: 500 })
  }
} 