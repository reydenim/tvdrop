
export const dynamic = 'force-dynamic'
export const revalidate = 0

import rawData from '@/data/channels.json'
import HomeClient from './HomeClient'
import type { Channel, HomeData } from './HomeClient'
import fs from 'fs'
import path from 'path'

// Load World Cup schedule
function loadWCSchedule() {
  try {
    const p = path.join(process.cwd(), 'src/data/worldcup_schedule.json')
    if (fs.existsSync(p)) {
      const raw = JSON.parse(fs.readFileSync(p, 'utf-8'))
      // Handle both array format (FIFA API) and {matches: [...]} format
      return Array.isArray(raw) ? raw : (raw.matches || [])
    }
  } catch {}
  return []
}

// Load health status for badge sync
function loadHealth(): Record<string, string> {
  try {
    const p = path.join(process.cwd(), 'src/data/health_status.json')
    if (fs.existsSync(p)) {
      const raw = JSON.parse(fs.readFileSync(p, 'utf-8'))
      const results = raw.results || {}
      const map: Record<string, string> = {}
      for (const [id, s] of Object.entries(results)) {
        if (s === 'live') map[id] = 'live'
        else if (s === 'dead') map[id] = 'dead'
        else if (s === 'geo-blocked') map[id] = 'geo-blocked'
      }
      return map
    }
  } catch {}
  return {}
}

// Pre-compute channels used in sections to minimize RSC payload
const channelMap = new Map(rawData.channels.map(c => [c.id, c]))
const channelByName = new Map(rawData.channels.map(c => [c.name, c]))

const PREVIEW_LIMIT = 20

function getChannelsByIds(ids: string[]): Channel[] {
  return ids.map(id => channelMap.get(id)).filter(Boolean) as Channel[]
}

function getChannelsByNames(names: string[]): Channel[] {
  return names.map(n => channelByName.get(n)).filter(Boolean) as Channel[]
}

const curated = getChannelsByIds(rawData.curated).slice(0, PREVIEW_LIMIT)

const genreLabels: Record<string, string> = {
  'general': 'All', 'news': 'News', 'sports': 'Sports', 'entertainment': 'Entertainment',
  'music': 'Music', 'movies': 'Movies', 'kids': 'Kids', 'religious': 'Religious',
  'education': 'Education', 'documentary': 'Documentary', 'comedy': 'Comedy',
  'culture': 'Culture', 'lifestyle': 'Lifestyle', 'travel': 'Travel',
  'cooking': 'Cooking', 'science': 'Science',
}

const genreSections = Object.entries(genreLabels).map(([key, label]) => ({
  title: label,
  channels: getChannelsByNames(rawData.categories[key] || []).slice(0, PREVIEW_LIMIT),
  link: `/semua?genre=${key}`,
}))

const indonesiaChannels = rawData.channels
  .filter(c => c.country === 'Indonesia')
  .slice(0, PREVIEW_LIMIT)
  .map(c => ({ id: c.id, name: c.name, logo: c.logo, country: c.country, url: c.url, quality: c.quality }))

// Collect only channels actually used in sections
const usedChannelIds = new Set<string>()
curated.forEach(c => usedChannelIds.add(c.id))
genreSections.forEach(s => s.channels.forEach(c => usedChannelIds.add(c.id)))
indonesiaChannels.forEach(c => usedChannelIds.add(c.id))

// Build minimal channels array + full curated IDs for client-side favorites
const channels: Channel[] = rawData.channels
  .filter(c => usedChannelIds.has(c.id))
  .map(c => ({ id: c.id, name: c.name, logo: c.logo, country: c.country, url: c.url, quality: c.quality }))

// NOTE: loadWCSchedule() and loadHealth() are called inside HomePage()
// to ensure fresh data on every request (force-dynamic).

export default function HomePage() {
  // Re-read dynamic data on every request
  const data: HomeData = {
    channels,
    curatedIds: rawData.curated,
    curated: curated.map(c => c.id),
    totalChannels: rawData.channels.length,
    health: loadHealth(),
    wcMatches: loadWCSchedule(),
    sections: [
      { title: 'Channel Populer', channels: curated.map(c => c.id), link: '/semua' },
      ...genreSections.map(s => ({ title: s.title, channels: s.channels.map(c => c.id), link: s.link })),
      { title: 'Indonesia', channels: indonesiaChannels.map(c => c.id), link: '/semua?country=Indonesia' },
    ],
  }
  return <HomeClient data={data} />
}
