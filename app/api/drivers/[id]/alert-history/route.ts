import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../libs/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const limit = parseInt(new URL(request.url).searchParams.get('limit') || '3')
    const alerts = await prisma.alertRecord.findMany({
      where: { driverId: id },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
    return NextResponse.json({ success: true, history: alerts })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch alert/call history' }, { status: 500 })
  }
}
