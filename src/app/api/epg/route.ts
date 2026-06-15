import { NextResponse } from 'next/server'
import epgData from '@/data/bein_epg.json'

const EPG = epgData.epg as Record<string, {
  epg_channel_id: string
  epg_name: string
  logo?: string
  programmes: Array<{ start: string; stop: string; title: string; desc?: string }>
}>

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const channel = searchParams.get('channel')
  const limit = parseInt(searchParams.get('limit') || '10')

  if (channel && EPG[channel]) {
    const data = EPG[channel]
    const now = new Date()
    const nowStr = now.toISOString().replace(/[-:]/g, '').slice(0, 15)

    // Find current programme
    let current: any = null
    let upcoming: any[] = []

    for (const p of data.programmes) {
      if (p.start <= nowStr && p.stop >= nowStr) {
        current = p
      } else if (p.start > nowStr && upcoming.length < limit) {
        upcoming.push(p)
      }
    }

    return NextResponse.json({
      channel: {
        id: channel,
        name: data.epg_name,
        logo: data.logo,
      },
      current,
      upcoming,
    }, { headers: { 'Cache-Control': 'public, max-age=300' } })
  }

  // List all channels with EPG
  const channels = Object.entries(EPG).map(([id, data]) => ({
    id,
    name: data.epg_name,
    logo: data.logo,
    programme_count: data.programmes.length,
  }))

  return NextResponse.json({ channels }, { headers: { 'Cache-Control': 'public, max-age=3600' } })
}
