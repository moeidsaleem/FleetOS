import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../libs/database'
import { z } from 'zod'

// Allowed config keys
const ALLOWED_KEYS = [
  'organization',
  'alertConfig',
  'apiKeys',
  'notificationTemplates',
  'security',
  'branding',
] as const
const ConfigKeySchema = z.enum(ALLOWED_KEYS)

// GET: /api/settings?key=organization or key=uberSyncStatus or key=uberSyncHistory
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')
    if (!key || !ALLOWED_KEYS.includes(key as any)) {
      // Special case for uberSyncStatus
      if (key === 'uberSyncStatus') {
        const { uberSyncService } = await import('../../../libs/uber-sync')
        const latestLog = await uberSyncService.getLatestSyncLog()
        return NextResponse.json({ success: true, data: latestLog })
      }
      // Special case for uberSyncHistory
      if (key === 'uberSyncHistory') {
        const { prisma } = await import('../../../libs/database')
        const logs = await prisma.uberSyncLog.findMany({
          orderBy: { startedAt: 'desc' },
          take: 20
        })
        return NextResponse.json({ success: true, data: logs })
      }
      return NextResponse.json({ success: false, error: 'Invalid or missing config key' }, { status: 400 })
    }
    const config = await prisma.systemConfig.findUnique({ where: { key } })
    if (!config) {
      return NextResponse.json({ success: false, error: 'Config not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: config.value })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// PUT: /api/settings?key=organization
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')
    if (!key || !ALLOWED_KEYS.includes(key as any)) {
      return NextResponse.json({ success: false, error: 'Invalid or missing config key' }, { status: 400 })
    }
    const value = await request.json()
    // Upsert config
    const updated = await prisma.systemConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })
    return NextResponse.json({ success: true, data: updated.value })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update settings' }, { status: 500 })
  }
} 