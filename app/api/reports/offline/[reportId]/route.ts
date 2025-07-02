import { NextRequest, NextResponse } from 'next/server'
import { getUberAPI } from '../../../../../libs/uber-api'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const { reportId } = await params;

    if (!reportId) {
      return NextResponse.json(
        { success: false, error: 'reportId is required' },
        { status: 400 }
      )
    }

    const uberAPI = getUberAPI()
    const reportStatus = await uberAPI.getReportById(reportId)

    return NextResponse.json({
      success: true,
      data: reportStatus,
    })
  } catch (error: any) {
    console.error('Error fetching offline report status:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch offline report status',
        details: error.message,
      },
      { status: 500 }
    )
  }
} 