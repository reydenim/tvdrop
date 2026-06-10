import { NextRequest, NextResponse } from 'next/server'
import data from '@/data/channels.json'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('q')?.toLowerCase()
  const country = searchParams.get('country')
  const category = searchParams.get('category')
  const genre = searchParams.get('genre')

  let channels = data.channels as any[]

  if (search) {
    channels = channels.filter(c => c.name.toLowerCase().includes(search))
  }
  if (country) {
    channels = channels.filter(c => c.country?.toLowerCase() === country.toLowerCase())
  }
  if (category && data.categories[category as keyof typeof data.categories]) {
    const prefixes = data.categories[category as keyof typeof data.categories] as string[]
    channels = channels.filter(c => prefixes.some(p => c.name.startsWith(p)))
  }
  if (genre) {
    const genreMap = data.channel_genres as Record<string, string[]>
    channels = channels.filter(c => genreMap[c.id]?.includes(genre))
  }

  return NextResponse.json({
    channels,
    curated: data.curated,
    categories: data.categories,
    genres: data.genres,
    channel_genres: data.channel_genres,
  })
}
