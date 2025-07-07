import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../../libs/database'
import fs from 'fs/promises'
import path from 'path'

// GET: Download/preview a document
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const { id, docId } = await params
    const doc = await prisma.driverDocument.findUnique({
      where: { id: docId, driverId: id }
    })
    if (!doc) return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 })
    const filePath = path.join(process.cwd(), 'public', doc.filePath)
    const file = await fs.readFile(filePath)
    const ext = path.extname(doc.fileName).toLowerCase()
    let contentType = 'application/octet-stream'
    if (ext === '.pdf') contentType = 'application/pdf'
    if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg'
    if (ext === '.png') contentType = 'image/png'
    return new Response(file, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${doc.fileName}"`
      }
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to download document' }, { status: 500 })
  }
}

// DELETE: Remove a document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const { id, docId } = await params
    const doc = await prisma.driverDocument.findUnique({
      where: { id: docId, driverId: id }
    })
    if (!doc) return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 })
    const filePath = path.join(process.cwd(), 'public', doc.filePath)
    try { await fs.unlink(filePath) } catch {}
    await prisma.driverDocument.delete({ where: { id: docId } })
    return NextResponse.json({ success: true, message: 'Document deleted' })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete document' }, { status: 500 })
  }
} 