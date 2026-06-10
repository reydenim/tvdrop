import { NextRequest, NextResponse } from 'next/server'
import { getChannels, getAll, getHealthStatus } from '@/lib/data-store'
import type { Channel } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.toLowerCase()
    const country = searchParams.get('country')
    const genre = searchParams.get('genre')
    const health = searchParams.get('health')
    const sort = searchParams.get('sort') || 'name'
    const order = (searchParams.get('order') || 'asc') as 'asc' | 'desc'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const perPage = Math.min(200, Math.max(1, parseInt(searchParams.get('perPage') || '50')))

    const data = getAll()
    const healthData = getHealthStatus()

    let channels = [...data.channels]

    // Filter
    if (q) channels = channels.filter(c => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q))
    if (country) channels = channels.filter(c => c.country.toLowerCase() === country.toLowerCase())
    if (genre) channels = channels.filter(c => data.channel_genres[c.id]?.includes(genre))
    if (health && healthData?.results) {
      channels = channels.filter(c => healthData.results[c.id] === health)
    }

    // Sort
    channels.sort((a, b) => {
      let cmp = 0
      switch (sort) {
        case 'name': cmp = a.name.localeCompare(b.name); break
        case 'country': cmp = a.country.localeCompare(b.country); break
        case 'quality': cmp = (a.quality || '').localeCompare(b.quality || ''); break
        default: cmp = a.name.localeCompare(b.name)
      }
      return order === 'desc' ? -cmp : cmp
    })

    const total = channels.length
    const totalPages = Math.ceil(total / perPage)
    const start = (page - 1) * perPage
    const items = channels.slice(start, start + perPage)

    // Enrich with health data
    const enriched = items.map(c => ({
      ...c,
      health: healthData?.results?.[c.id] || null,
      genres: data.channel_genres[c.id] || [],
    }))

    // Get unique countries list for filter dropdown
    const countries = [...new Set(data.channels.map(c => c.country))].sort()

    return NextResponse.json({
      channels: enriched,
      pagination: { page, perPage, total, totalPages },
      filters: { countries, genres: data.genres },
    })
  } catch (err) {
    console.error('Admin channels error:', err)
    return NextResponse.json({ error: 'Failed to load channels' }, { status: 500 })
  }
}
