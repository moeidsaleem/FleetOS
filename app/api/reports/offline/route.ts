import { NextRequest, NextResponse } from 'next/server'
import { getUberAPI } from '../../../../libs/uber-api'

export async function GET() {
  try {
    const uberAPI = getUberAPI()
    const reportsResponse = await uberAPI.listReports()

    return NextResponse.json({
      success: true,
      data: reportsResponse,
    })
  } catch (error: any) {
    console.error('Error listing offline reports:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to list offline reports',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { reportType, filters } = await request.json()

    if (!reportType || !filters) {
      return NextResponse.json(
        { success: false, error: 'reportType and filters are required' },
        { status: 400 }
      )
    }

    const uberAPI = getUberAPI()
    const reportResponse = await uberAPI.requestOfflineReport(reportType, filters)

    return NextResponse.json({
      success: true,
      data: reportResponse,
    })
  } catch (error: any) {
    console.error('Error requesting offline report:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to request offline report',
        details: error.message,
      },
      { status: 500 }
    )
  }
} 