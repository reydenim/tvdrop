import { NextRequest, NextResponse } from 'next/server'
import { getCurated, setCurated, getAll } from '@/lib/data-store'

export async function GET() {
  try {
    const data = getAll()
    const curated = data.curated.map(id => {
      const ch = data.channels.find(c => c.id === id)
      return ch ? { id, name: ch.name, country: ch.country, logo: ch.logo } : null
    }).filter(Boolean)

    // All channels for the selector (id + name only, compact)
    const allChannels = data.channels.map(c => ({ id: c.id, name: c.name, country: c.country, logo: c.logo }))

    return NextResponse.json({ curated, allChannels })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load curated' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids, action, channelId } = body

    if (action === 'reorder' && Array.isArray(ids)) {
      setCurated(ids)
      return NextResponse.json({ success: true })
    }
    if (action === 'add' && channelId) {
      const data = getAll()
      if (data.curated.includes(channelId)) return NextResponse.json({ success: true })
      if (!data.channels.find(c => c.id === channelId)) {
        return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
      }
      data.curated.push(channelId)
      setCurated(data.curated)
      return NextResponse.json({ success: true })
    }
    if (action === 'remove' && channelId) {
      const data = getAll()
      data.curated = data.curated.filter(id => id !== channelId)
      setCurated(data.curated)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}
