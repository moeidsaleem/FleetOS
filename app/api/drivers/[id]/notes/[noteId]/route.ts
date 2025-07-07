import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../../libs/database'

// DELETE: Remove a note
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const { id, noteId } = await params
    const note = await prisma.driverNote.findUnique({ where: { id: noteId, driverId: id } })
    if (!note) return NextResponse.json({ success: false, error: 'Note not found' }, { status: 404 })
    await prisma.driverNote.delete({ where: { id: noteId } })
    return NextResponse.json({ success: true, message: 'Note deleted' })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete note' }, { status: 500 })
  }
} 