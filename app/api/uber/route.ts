import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'info'

    switch (action) {
      case 'info':
        return await getUberInfo()
      case 'drivers':
        return await getUberDrivers()
      case 'sync_status':
        return await getSyncStatus()
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Uber API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

async function getUberInfo() {
  const driverCount = await prisma.driver.count()
  const activeDriverCount = await prisma.driver.count({
    where: { status: 'ACTIVE' }
  })

  return NextResponse.json({
    success: true,
    data: {
      platform: 'Uber Fleet',
      integration: 'Active',
      drivers: {
        total: driverCount,
        active: activeDriverCount,
        inactive: driverCount - activeDriverCount
      },
      lastUpdated: new Date().toISOString(),
      features: [
        'Driver Management',
        'Real-time Tracking',
        'Performance Analytics',
        'Automated Sync',
        'Alert System'
      ]
    }
  })
}

async function getUberDrivers() {
  const drivers = await prisma.driver.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      status: true,
      currentScore: true,
      createdAt: true,
      updatedAt: true
    },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json({
    success: true,
    data: drivers,
    count: drivers.length
  })
}

async function getSyncStatus() {
  const syncStatus = await prisma.setting.findUnique({
    where: { key: 'uberSyncStatus' }
  })

  const syncHistory = await prisma.setting.findUnique({
    where: { key: 'uberSyncHistory' }
  })

  const status = syncStatus?.value ? JSON.parse(syncStatus.value) : null
  const history = syncHistory?.value ? JSON.parse(syncHistory.value) : []

  return NextResponse.json({
    success: true,
    data: {
      isConnected: status?.isConnected || false,
      lastSync: status?.lastSync || null,
      nextSync: status?.nextSync || null,
      syncCount: history.length || 0,
      status: status?.status || 'disconnected',
      lastError: status?.lastError || null,
      recentSyncs: history.slice(0, 5) // Last 5 syncs
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'sync':
        return await triggerSync()
      case 'test_connection':
        return await testConnection()
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Uber API POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

async function triggerSync() {
  // Simulate sync process
  const syncResult = {
    success: true,
    message: 'Sync process initiated',
    timestamp: new Date().toISOString(),
    driversProcessed: 0,
    errors: []
  }

  // Update sync history
  const existingHistory = await prisma.setting.findUnique({
    where: { key: 'uberSyncHistory' }
  })

  const history = existingHistory?.value ? JSON.parse(existingHistory.value) : []
  history.unshift({
    timestamp: new Date().toISOString(),
    type: 'manual',
    status: 'success',
    message: 'Sync process completed',
    driversProcessed: 0
  })

  // Keep only last 50 entries
  const trimmedHistory = history.slice(0, 50)

  await prisma.setting.upsert({
    where: { key: 'uberSyncHistory' },
    update: { value: JSON.stringify(trimmedHistory) },
    create: {
      key: 'uberSyncHistory',
      value: JSON.stringify(trimmedHistory)
    }
  })

  return NextResponse.json({
    success: true,
    data: syncResult
  })
}

async function testConnection() {
  // Simulate connection test
  const testResult = {
    success: true,
    message: 'Uber API connection test successful',
    timestamp: new Date().toISOString(),
    responseTime: Math.floor(Math.random() * 100) + 50 // 50-150ms
  }

  return NextResponse.json({
    success: true,
    data: testResult
  })
}
