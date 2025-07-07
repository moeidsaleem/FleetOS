import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../libs/database'
import { z } from 'zod'
import formidable from 'formidable'
import fs from 'fs/promises'
import path from 'path'

export const config = { api: { bodyParser: false } }

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']

const DocumentUploadSchema = z.object({
  type: z.enum(['LICENSE', 'EMIRATES_ID', 'VISA', 'INSURANCE', 'OTHER']),
  expiryDate: z.string().optional(),
})

// GET: List all documents for a driver
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const documents = await prisma.driverDocument.findMany({
      where: { driverId: id },
      orderBy: { uploadedAt: 'desc' },
    })
    return NextResponse.json({ success: true, data: documents })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch documents' }, { status: 500 })
  }
}

// POST: Upload a new document
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const form = formidable({ multiples: false })
    const [fields, files] = await new Promise<any>((resolve, reject) => {
      form.parse(request as any, (err: any, fields: any, files: any) => {
        if (err) reject(err)
        else resolve([fields, files])
      })
    })
    let fileObj = files.file || files.csv
    if (!fileObj) return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 })
    if (Array.isArray(fileObj)) fileObj = fileObj[0]
    if (!ALLOWED_TYPES.includes(fileObj.mimetype)) {
      return NextResponse.json({ success: false, error: 'Invalid file type' }, { status: 400 })
    }
    if (fileObj.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: 'File too large' }, { status: 400 })
    }
    // Validate metadata
    const meta = DocumentUploadSchema.parse(fields)
    // Save file to /public/driver-docs/[driverId]/
    const destDir = path.join(process.cwd(), 'public', 'driver-docs', id)
    await fs.mkdir(destDir, { recursive: true })
    const fileName = `${Date.now()}_${fileObj.originalFilename}`
    const destPath = path.join(destDir, fileName)
    await fs.copyFile(fileObj.filepath, destPath)
    // Save record in DB
    const doc = await prisma.driverDocument.create({
      data: {
        driverId: id,
        type: meta.type,
        fileName: fileObj.originalFilename,
        filePath: `/driver-docs/${id}/${fileName}`,
        expiryDate: meta.expiryDate ? new Date(meta.expiryDate) : undefined,
        status: 'VALID',
      }
    })
    return NextResponse.json({ success: true, data: doc })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to upload document' }, { status: 500 })
  }
} 