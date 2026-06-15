'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useFavorites } from '@/lib/useFavorites'

interface Channel {
  id: string
  name: string
  country: string
  quality: string
  url: string
  logo: string
}

interface MatchChannel {
  name: string
  url: string
}

interface Match {
  sport: string
  id: string
  home: string
  away: string
  score: string
  league: string
  state: number
  channels?: MatchChannel[]
}

interface MatchData {
  live: boolean
  updated: string | null
  matches: Match[]
}

const sportsLeagues = [
  'bein', 'sport', 'espn', 'uefa', 'liga', 'premier', 'champions',
  'fifa', 'serie a', 'bundesliga', 'ligue', 'eredivisie', 'nba',
  'nfl', 'mlb', 'boxing', 'wwe', 'ufc', 'racing', 'motogp',
  'formula', 'nhl', 'tennis', 'golf', 'football', 'soccer',
  'calcio', 'futbol', 'sky sport', 'directv sport', 'dazn', 'eleven'
]

const SPORT_F = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
  <circle cx="12" cy="12" r="10"/><path d="M4.93 4.93c3.9 3.9 10.24 3.9 14.14 0M4.93 19.07c3.9-3.9 10.24-3.9 14.14 0"/>
  <path d="M12 2v20M2 12h20"/>
</svg>

const LIVE_DOT = <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />

export default function OlahragaPage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [matches, setMatches] = useState<MatchData | null>(null)
  const [loading, setLoading] = useState(true)
  const { toggleFavorite, isFavorite } = useFavorites()

  useEffect(() => {
    async function load() {
      const [chRes, mRes] = await Promise.all([
        fetch('/api/channels?genre=sports'),
        fetch('/api/matches'),
      ])
      const chData = await chRes.json()
      const mData = await mRes.json()

      setChannels(chData.channels || [])
      setMatches(mData)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-4">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className="bg-[#1a1a1a] rounded overflow-hidden w-full aspect-[16/9] animate-pulse">
              <div className="w-full h-full bg-[#222] rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/95 backdrop-blur border-b border-[#222]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-[#E50914] font-bold text-lg">TVDROP</Link>
          <span className="text-[#555]">/</span>
          <h1 className="font-bold text-lg flex items-center gap-2">
            {SPORT_F} Olahraga
          </h1>
          {matches?.live && (
            <span className="flex items-center gap-1.5 text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full">
              {LIVE_DOT} LIVE
            </span>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {/* Live Matches Section */}
        {matches?.live && matches.matches.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              {LIVE_DOT} <span className="text-red-400">Pertandingan Live</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {matches.matches.map((m, i) => (
                <div key={i} className="bg-gradient-to-br from-[#1a1a1a] to-[#111] border border-[#222] rounded-xl p-4 hover:border-red-500/30 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[#888] uppercase">{m.league}</span>
                    <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                      {LIVE_DOT} LIVE
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-right flex-1">
                      <p className="font-bold text-sm">{m.home}</p>
                    </div>
                    <div className="px-4">
                      <span className="text-xl font-black tabular-nums">{m.score}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm">{m.away}</p>
                    </div>
                  </div>
                  {m.channels && m.channels.length > 0 && (
                    <div className="border-t border-[#222] pt-2 mt-2">
                      <p className="text-xs text-[#666] mb-1.5">Channel tersedia:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {m.channels.map((ch, j) => (
                          <Link
                            key={j}
                            href={`/watch/${encodeURIComponent(ch.url)}`}
                            className="text-xs bg-[#E50914]/10 hover:bg-[#E50914]/30 text-red-400 px-2.5 py-1 rounded-full transition-colors"
                          >
                            {ch.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Sports Channels Grid */}
        <section>
          <h2 className="text-xl font-bold mb-4">Channel Olahraga</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
            {channels.map(ch => (
              <Link
                key={ch.id}
                href={`/watch/${encodeURIComponent(ch.id)}`}
                className="group relative bg-[#1a1a1a] rounded-lg overflow-hidden hover:ring-1 hover:ring-[#E50914]/30 hover:scale-105 hover:shadow-[0_8px_30px_rgba(229,9,20,.15)] transition-all duration-200"
              >
                <div className="aspect-[16/10] relative bg-[#111] flex items-center justify-center">
                  {ch.logo ? (
                    <img
                      src={ch.logo}
                      alt={ch.name}
                      className="w-full h-full object-contain p-3"
                      onError={e => {
                        const t = e.currentTarget
                        t.style.display = 'none'
                        const p = t.parentElement!
                        p.style.backgroundColor = '#E50914'
                        const s = document.createElement('span')
                        s.className = 'text-white font-black text-3xl'
                        s.textContent = ch.name.charAt(0).toUpperCase()
                        p.appendChild(s)
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#E50914' }}>
                      <span className="text-white font-black text-3xl">{ch.name.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 flex items-center justify-center transition-all">
                    <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                      <svg viewBox="0 0 24 24" fill="#E50914" className="w-5 h-5 ml-0.5"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                  </div>
                  {/* Favorite */}
                  <button
                    onClick={e => { e.preventDefault(); e.stopPropagation(); toggleFavorite(ch) }}
                    className="absolute top-1.5 right-1.5 z-20 w-7 h-7 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill={isFavorite(ch.id) ? '#E50914' : 'none'} stroke={isFavorite(ch.id) ? '#E50914' : 'white'} strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                    </svg>
                  </button>
                </div>
                <div className="p-2">
                  <p className="text-xs text-white line-clamp-1 font-medium">{ch.name}</p>
                  {ch.country && (
                    <p className="text-[10px] text-[#666] mt-0.5">{ch.country}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
          {channels.length === 0 && (
            <p className="text-[#555] text-center py-12">Gak ada channel olahraga nih</p>
          )}
        </section>
      </div>
    </div>
  )
}
