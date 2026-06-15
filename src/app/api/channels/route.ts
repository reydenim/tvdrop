import { NextRequest, NextResponse } from 'next/server'
import data from '@/data/channels.json'
import fs from 'fs'
import path from 'path'

const CHANNELS = data.channels as any[]
const CURATED = data.curated
const CATEGORIES = data.categories
const GENRES = data.genres
const CHANNEL_GENRES = data.channel_genres as Record<string, string[]>

// Health status cache (TTL 5 min — health cron runs every 6h)
let healthCache: { live: Set<string>; dead: Set<string>; geoBlocked: Set<string>; ts: number } | null = null

function getHealth(): { live: Set<string>; dead: Set<string>; geoBlocked: Set<string> } {
  if (healthCache && Date.now() - healthCache.ts < 300_000) {
    return healthCache
  }
  try {
    const p = path.join(process.cwd(), 'src/data/health_status.json')
    if (fs.existsSync(p)) {
      const raw = JSON.parse(fs.readFileSync(p, 'utf-8'))
      const results = raw.results || {}
      const live = new Set<string>()
      const dead = new Set<string>()
      const geoBlocked = new Set<string>()
      for (const [id, s] of Object.entries(results)) {
        if (s === 'live') live.add(id)
        else if (s === 'dead') dead.add(id)
        else if (s === 'geo-blocked') geoBlocked.add(id)
      }
      healthCache = { live, dead, geoBlocked, ts: Date.now() }
      return healthCache
    }
  } catch {}
  return { live: new Set(), dead: new Set(), geoBlocked: new Set() }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('q')?.toLowerCase()
  const country = searchParams.get('country')
  const category = searchParams.get('category')
  const genre = searchParams.get('genre')
  const tag = searchParams.get('tag')?.toLowerCase()
  const id = searchParams.get('id')
  const limit = parseInt(searchParams.get('limit') || '0')
  const offset = parseInt(searchParams.get('offset') || '0')
  const lite = searchParams.get('lite') === '1'

  if (id) {
    const decoded = decodeURIComponent(id)
    const found = CHANNELS.find((c: any) => c.id === decoded || c.name === decoded)
    const response = NextResponse.json({ channel: found || null, channel_genres: CHANNEL_GENRES })
    response.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=86400')
    return response
  }

  if (lite) {
    let channels = CHANNELS
    if (search) channels = channels.filter((c: any) => c.name.toLowerCase().includes(search))
    if (country) channels = channels.filter((c: any) => c.country?.toLowerCase() === country.toLowerCase())
    if (tag) {
      const tags = tag.split(',')
      channels = channels.filter((c: any) => tags.some((t: string) => c.name.toLowerCase().includes(t) || c.country?.toLowerCase().includes(t)))
    }
    if (genre) channels = channels.filter((c: any) => CHANNEL_GENRES[c.id]?.includes(genre))
    const total = channels.length
    if (offset > 0) channels = channels.slice(offset)
    if (limit > 0) channels = channels.slice(0, limit)
    channels = channels.map((c: any) => ({ id: c.id, name: c.name, logo: c.logo, country: c.country }))
    const response = NextResponse.json({ channels, total, curated: CURATED, categories: CATEGORIES, genres: GENRES, channel_genres: CHANNEL_GENRES })
    response.headers.set('Cache-Control', 'public, max-age=1800, s-maxage=7200')
    return response
  }

  // Full response with health status
  let channels = CHANNELS
  if (search) channels = channels.filter((c: any) => c.name.toLowerCase().includes(search))
  if (country) channels = channels.filter((c: any) => c.country?.toLowerCase() === country.toLowerCase())
  if (tag) {
    const tags = tag.split(',')
    channels = channels.filter((c: any) => tags.some((t: string) => c.name.toLowerCase().includes(t) || c.country?.toLowerCase().includes(t)))
  }
  if (category && (CATEGORIES as Record<string, string[]>)[category]) {
    const prefixes = (CATEGORIES as Record<string, string[]>)[category]
    channels = channels.filter((c: any) => prefixes.some((p: string) => c.name.startsWith(p)))
  }
  if (genre) channels = channels.filter((c: any) => CHANNEL_GENRES[c.id]?.includes(genre))
  const total = channels.length
  if (offset > 0) channels = channels.slice(offset)
  if (limit > 0) channels = channels.slice(0, limit)

  const h = getHealth()
  const healthMap: Record<string, string> = {}
  for (const c of channels) {
    if (h.live.has(c.id)) healthMap[c.id] = 'live'
    else if (h.dead.has(c.id)) healthMap[c.id] = 'dead'
    else if (h.geoBlocked.has(c.id)) healthMap[c.id] = 'geo-blocked'
  }

  const response = NextResponse.json({
    channels,
    total,
    curated: CURATED,
    categories: CATEGORIES,
    genres: GENRES,
    channel_genres: CHANNEL_GENRES,
    health: healthMap,
  })

  response.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=86400')
  return response
}
