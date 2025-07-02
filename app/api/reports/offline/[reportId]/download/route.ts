import { NextRequest, NextResponse } from 'next/server'
import { getUberAPI } from '../../../../../../libs/uber-api'

export async function POST(
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
    const downloadUrlData = await uberAPI.createReportDownloadUrl(reportId)

    return NextResponse.json({
      success: true,
      data: downloadUrlData,
    })
  } catch (error: any) {
    console.error('Error creating offline report download URL:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create offline report download URL',
        details: error.message,
      },
      { status: 500 }
    )
  }
} 