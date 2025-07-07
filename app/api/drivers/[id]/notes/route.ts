import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../libs/database'
import { z } from 'zod'

const NoteSchema = z.object({
  author: z.string().min(1),
  content: z.string().min(1).max(1000),
})

// GET: List all notes for a driver
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const notes = await prisma.driverNote.findMany({
      where: { driverId: id },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ success: true, data: notes })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch notes' }, { status: 500 })
  }
}

// POST: Add a new note
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const data = NoteSchema.parse(body)
    const note = await prisma.driverNote.create({
      data: { driverId: id, ...data }
    })
    return NextResponse.json({ success: true, data: note })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validation error', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: 'Failed to add note' }, { status: 500 })
  }
} 