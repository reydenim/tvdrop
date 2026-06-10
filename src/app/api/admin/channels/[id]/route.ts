import { NextRequest, NextResponse } from 'next/server'
import { getChannel, updateChannel, deleteChannel } from '@/lib/data-store'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const ok = updateChannel(id, body)
    if (!ok) return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ok = deleteChannel(id)
    if (!ok) return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
