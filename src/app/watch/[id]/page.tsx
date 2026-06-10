'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Player from '@/components/Player'
import ChannelCard from '@/components/ChannelCard'
import { useFavorites } from '@/lib/useFavorites'

interface Channel {
  id: string
  name: string
  country: string
  quality?: string
  url: string
  logo?: string
}

export default function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [ch, setCh] = useState<Channel | null>(null)
  const [allCh, setAllCh] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const { isFavorite, toggleFavorite } = useFavorites()

  useEffect(() => {
    fetch('/api/channels')
      .then(r => r.json())
      .then(data => {
        const decoded = decodeURIComponent(id)
        const found = data.channels.find((c: Channel) => c.id === decoded || c.name === decoded)
        if (found) setCh(found)
        setAllCh(data.channels || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><span className="dot-pulse"><span>.</span><span>.</span><span>.</span></span></div>

  if (!ch) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <div className="text-center pt-20">
          <p className="text-[#555] mb-4">Channel tidak ditemukan</p>
          <button onClick={() => router.push('/')} className="text-xs bg-white text-black px-4 py-2 rounded-full font-semibold">Kembali</button>
        </div>
      </div>
    )
  }

  // Other channels: same country first, then random
  const sameCountry = allCh.filter(c => c.country === ch.country && c.id !== ch.id).slice(0, 36)
  const others = sameCountry.length < 36
    ? [...sameCountry, ...allCh.filter(c => c.id !== ch.id && c.country !== ch.country).slice(0, 36 - sameCountry.length)]
    : sameCountry

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <Player ch={ch} onClose={() => router.push('/')} />

      <div className="max-w-5xl mx-auto px-4 py-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-lg bg-[#1e1e1e] flex items-center justify-center text-lg font-bold text-[#555] flex-shrink-0 overflow-hidden">
            {ch.logo ? (
              <img src={ch.logo} alt={ch.name} className="w-full h-full object-contain" />
            ) : (
              ch.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">{ch.name}</h1>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-[11px] text-[#666]">{ch.country}</span>
              <span className="text-[#333]">·</span>
              <span className="text-[11px] text-green-400">● Live</span>
              {ch.quality && <><span className="text-[#333]">·</span><span className="text-[11px] text-[#666]">{ch.quality}</span></>}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mb-5">
          <button onClick={() => toggleFavorite(ch)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-[#1a1a1a] hover:bg-[#2a2a2a] transition">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill={isFavorite(ch.id) ? '#E50914' : 'none'} stroke={isFavorite(ch.id) ? '#E50914' : '#888'} strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
            </svg>
            {isFavorite(ch.id) ? 'Difavoritkan' : 'Favorit'}
          </button>
          <button onClick={async () => {
            try {
              await navigator.clipboard.writeText(window.location.href)
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
            } catch {}
          }}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-[#1a1a1a] hover:bg-[#2a2a2a] transition">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
            {copied ? 'Tersalin!' : 'Bagikan'}
          </button>
        </div>

        <section>
          <h2 className="text-sm font-semibold mb-3">Channel Lainnya</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
            {others.map(c => (
              <ChannelCard key={c.id} ch={c} />
            ))}
          </div>
          {allCh.length > others.length && (
            <div className="mt-5 text-center">
              <button onClick={() => router.push('/semua')} className="text-xs text-[#666] hover:text-white bg-[#1a1a1a] px-5 py-2 rounded-full transition">
                Lihat Semua Channel
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
