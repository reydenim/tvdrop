import fs from 'fs'
import path from 'path'
import type { DataStore } from './types'

const DATA_PATH = path.join(process.cwd(), 'src/data/channels.json')

let cache: DataStore | null = null
let cacheMtime = 0

function read(): DataStore {
  const stat = fs.statSync(DATA_PATH)
  if (cache && stat.mtimeMs === cacheMtime) return cache!
  const raw = fs.readFileSync(DATA_PATH, 'utf-8')
  cache = JSON.parse(raw)
  cacheMtime = stat.mtimeMs
  return cache!
}

function write(data: DataStore): void {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8')
  cache = data
  cacheMtime = Date.now()
}

export function getAll(): DataStore {
  return read()
}

export function getChannels() {
  return read().channels
}

export function getChannel(id: string) {
  return read().channels.find(c => c.id === id) || null
}

export function updateChannel(id: string, updates: Partial<{ name: string; country: string; quality: string; url: string; logo: string }>): boolean {
  const data = read()
  const idx = data.channels.findIndex(c => c.id === id)
  if (idx === -1) return false
  data.channels[idx] = { ...data.channels[idx], ...updates }
  write(data)
  return true
}

export function deleteChannel(id: string): boolean {
  const data = read()
  const idx = data.channels.findIndex(c => c.id === id)
  if (idx === -1) return false
  data.channels.splice(idx, 1)
  // Clean up references
  data.curated = data.curated.filter(c => c !== id)
  delete data.channel_genres[id]
  write(data)
  return true
}

export function getCurated() {
  return read().curated
}

export function setCurated(ids: string[]): void {
  const data = read()
  data.curated = ids
  write(data)
}

export function addCurated(id: string): boolean {
  const data = read()
  if (!data.channels.find(c => c.id === id)) return false
  if (data.curated.includes(id)) return false
  data.curated.push(id)
  write(data)
  return true
}

export function removeCurated(id: string): void {
  const data = read()
  data.curated = data.curated.filter(c => c !== id)
  write(data)
}

export function reorderCurated(ids: string[]): boolean {
  const data = read()
  // Validate all IDs exist
  const valid = ids.every(id => data.channels.some(c => c.id === id))
  if (!valid) return false
  data.curated = ids
  write(data)
  return true
}

export function getCategories() {
  const data = read()
  return { categories: data.categories, genres: data.genres, channel_genres: data.channel_genres }
}

export function assignGenre(channelId: string, genre: string): boolean {
  const data = read()
  if (!data.channels.find(c => c.id === channelId)) return false
  if (!data.genres.includes(genre)) return false
  if (!data.channel_genres[channelId]) data.channel_genres[channelId] = []
  if (!data.channel_genres[channelId].includes(genre)) {
    data.channel_genres[channelId].push(genre)
    // Also add to categories map if not already
    const ch = data.channels.find(c => c.id === channelId)!
    if (!data.categories[genre]) data.categories[genre] = []
    if (!data.categories[genre].includes(ch.name)) {
      data.categories[genre].push(ch.name)
    }
    write(data)
  }
  return true
}

export function removeGenre(channelId: string, genre: string): boolean {
  const data = read()
  if (!data.channel_genres[channelId]) return false
  data.channel_genres[channelId] = data.channel_genres[channelId].filter(g => g !== genre)
  // Also remove from categories map
  const ch = data.channels.find(c => c.id === channelId)
  if (ch && data.categories[genre]) {
    data.categories[genre] = data.categories[genre].filter(n => n !== ch.name)
  }
  write(data)
  return true
}

/** Health status cache */
let healthCache: { timestamp: string; results: Record<string, string> } | null = null

export function getHealthStatus() {
  if (healthCache) return healthCache
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), 'src/data/health_status.json'), 'utf-8')
    healthCache = JSON.parse(raw)
    return healthCache
  } catch {
    return null
  }
}

export function getStats() {
  const data = read()
  const health = getHealthStatus()
  const total = data.channels.length

  // Country counts
  const byCountry: Record<string, number> = {}
  data.channels.forEach(c => {
    byCountry[c.country] = (byCountry[c.country] || 0) + 1
  })

  // Genre counts
  const byGenre: Record<string, number> = {}
  Object.entries(data.channel_genres).forEach(([_, genres]) => {
    genres.forEach(g => {
      byGenre[g] = (byGenre[g] || 0) + 1
    })
  })

  // Health counts
  const byHealth: Record<string, number> = {}
  if (health?.results) {
    Object.values(health.results).forEach(s => {
      byHealth[s] = (byHealth[s] || 0) + 1
    })
  }

  const withLogo = data.channels.filter(c => c.logo).length

  return {
    total,
    withLogo,
    noLogo: total - withLogo,
    curated: data.curated.length,
    countries: Object.keys(byCountry).length,
    genres: data.genres.length,
    byCountry,
    byGenre,
    byHealth: health ? byHealth : null,
    healthTimestamp: health?.timestamp || null,
  }
}
