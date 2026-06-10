import { NextRequest, NextResponse } from 'next/server'
import { getStats } from '@/lib/data-store'

export async function GET() {
  try {
    const stats = getStats()
    return NextResponse.json(stats)
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 })
  }
}
