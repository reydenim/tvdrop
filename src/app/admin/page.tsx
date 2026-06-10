'use client'

import { useEffect, useState } from 'react'

interface Stats {
  total: number; withLogo: number; noLogo: number; curated: number
  countries: number; genres: number
  byCountry: Record<string, number>
  byGenre: Record<string, number>
  byHealth: Record<string, number> | null
  healthTimestamp: string | null
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-32 bg-[#1a1a1a] rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-[#111] rounded-lg animate-pulse border border-[#222]" />
          ))}
        </div>
      </div>
    )
  }

  if (!stats) return <div className="text-center text-[#555] py-16 text-sm">Gagal load stats</div>

  const topCountries = Object.entries(stats.byCountry)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
  const maxCountry = topCountries[0]?.[1] || 1

  const topGenres = Object.entries(stats.byGenre)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)

  const healthLabels: Record<string, { label: string; color: string }> = {
    live: { label: 'Live', color: 'text-green-400' },
    dead: { label: 'Dead', color: 'text-red-400' },
    'geo-blocked': { label: 'Geo-blocked', color: 'text-yellow-400' },
    redirect: { label: 'Redirect', color: 'text-blue-400' },
    timeout: { label: 'Timeout', color: 'text-orange-400' },
    unknown: { label: 'Unknown', color: 'text-[#555]' },
  }

  const StatCard = ({ label, value, sub, color }: { label: string; value: number | string; sub?: string; color?: string }) => (
    <div className="bg-[#111] border border-[#222] rounded-lg p-4">
      <p className="text-[10px] text-[#555] uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color || 'text-white'}`}>{value}</p>
      {sub && <p className="text-[10px] text-[#555] mt-0.5">{sub}</p>}
    </div>
  )

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold">Dashboard</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Channel" value={stats.total.toLocaleString()} />
        <StatCard label="Dengan Logo" value={stats.withLogo.toLocaleString()} sub={`${stats.noLogo.toLocaleString()} tanpa logo`} />
        <StatCard label="Curated" value={stats.curated} sub={`dari ${stats.total.toLocaleString()} channel`} />
        <StatCard label="Negara" value={stats.countries} sub={`${stats.genres} genre`} />
      </div>

      {/* Health status */}
      {stats.byHealth && (
        <>
          <h2 className="text-sm font-semibold text-[#888] mt-2">Health Check</h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {Object.entries(stats.byHealth).map(([key, count]) => {
              const hl = healthLabels[key] || { label: key, color: 'text-[#555]' }
              return <StatCard key={key} label={hl.label} value={count} color={hl.color} />
            })}
          </div>
          {stats.healthTimestamp && (
            <p className="text-[10px] text-[#555]">Last scan: {stats.healthTimestamp}</p>
          )}
        </>
      )}

      {/* Top countries */}
      <div className="bg-[#111] border border-[#222] rounded-lg p-4">
        <h2 className="text-sm font-semibold mb-3">Top 10 Negara</h2>
        <div className="space-y-2">
          {topCountries.map(([country, count]) => (
            <div key={country} className="flex items-center gap-3">
              <span className="w-24 text-xs text-[#aaa] truncate shrink-0">{country}</span>
              <div className="flex-1 h-4 bg-[#1a1a1a] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#E50914] rounded-full transition-all"
                  style={{ width: `${(count / maxCountry) * 100}%` }}
                />
              </div>
              <span className="text-xs text-[#555] w-12 text-right">{count.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top genres */}
      <div className="bg-[#111] border border-[#222] rounded-lg p-4">
        <h2 className="text-sm font-semibold mb-3">Genre</h2>
        <div className="flex flex-wrap gap-2">
          {topGenres.map(([genre, count]) => (
            <div key={genre} className="flex items-center gap-1.5 bg-[#1a1a1a] px-3 py-1.5 rounded-full text-xs">
              <span className="text-[#aaa]">{genre}</span>
              <span className="text-[#555]">{count.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
