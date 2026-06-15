'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Player from '@/components/Player'
import ChannelCard from '@/components/ChannelCard'
import AdBanner from '@/components/AdBanner'
import { useFavorites } from '@/lib/useFavorites'

interface Channel { id: string; name: string; country: string; quality?: string; url: string; logo?: string; headers?: Record<string, string> }
const genreLabels: Record<string, string> = { sports:'Olahraga', news:'Berita', entertainment:'Hiburan', music:'Musik', movies:'Film', kids:'Anak', religious:'Religi', education:'Edukasi', documentary:'Dokumenter', comedy:'Komedi', culture:'Budaya', lifestyle:'Gaya Hidup', travel:'Travel', cooking:'Masak', science:'Sains', auto:'Otomotif', business:'Bisnis', animation:'Animasi', classic:'Klasik', family:'Keluarga' }

export default function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [ch, setCh] = useState<Channel | null>(null)
  const [allCh, setAllCh] = useState<Channel[]>([])
  const [relatedHealth, setRelatedHealth] = useState<Record<string, string>>({})
  const [channelGenres, setChannelGenres] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)
  const [playerStatus, setPlayerStatus] = useState('Loading')
  const [copied, setCopied] = useState(false)
  const [epg, setEpg] = useState<any>(null)
  const { isFavorite, toggleFavorite } = useFavorites()

  useEffect(() => {
    async function load() {
      const decoded = decodeURIComponent(id)
      const chRes = await fetch('/api/channels?id=' + encodeURIComponent(decoded))
      const chData = await chRes.json()
      if (chData.channel) setCh(chData.channel)
      // Fetch EPG if available
      const chId = chData.channel?.id
      if (chId) {
        fetch('/api/epg?channel=' + encodeURIComponent(chId) + '&limit=5')
          .then(r => r.json())
          .then(d => { if (d.current || d.upcoming?.length) setEpg(d) })
          .catch(() => {})
      }
      const genres = (chData.channel_genres || {})
      setChannelGenres(genres)

      const chGenres = chData.channel?.id ? genres[chData.channel.id] || [] : []
      let relatedChannels: Channel[] = []
      for (const g of chGenres.slice(0, 3)) {
        if (relatedChannels.length >= 36) break
        const r = await fetch('/api/channels?genre=' + g + '&lite=1&limit=' + (36 - relatedChannels.length))
        const d = await r.json()
        relatedChannels = [...relatedChannels, ...(d.channels || [])]
        if (d.health) setRelatedHealth(prev => ({ ...prev, ...d.health }))
      }
      if (relatedChannels.length < 12 && chData.channel) {
        const r = await fetch('/api/channels?country=' + encodeURIComponent(chData.channel.country) + '&lite=1&limit=24')
        const d = await r.json()
        const existing = new Set(relatedChannels.map((c: Channel) => c.id))
        relatedChannels = [...relatedChannels, ...(d.channels || []).filter((c: Channel) => !existing.has(c.id))]
        if (d.health) setRelatedHealth(prev => ({ ...prev, ...d.health }))
      }
      setAllCh(relatedChannels)
      setLoading(false)
    }
    load()
  }, [id])

  // Show shell immediately — no loading spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white tv-shell">
        <Header />
        <div className="pt-[64px] sm:pt-[72px]">
          <div className="max-w-[1500px] mx-auto px-2 sm:px-6">
            <div className="rounded-none sm:rounded-3xl overflow-hidden ring-1 ring-white/[0.08] bg-black aspect-video max-h-[72vh]" />
          </div>
        </div>
      </div>
    )
  }

  if (!ch) return <div className="min-h-screen bg-black text-white"><Header /><div className="text-center pt-32"><p className="text-white/35 mb-4">Channel tidak ditemukan</p><button onClick={() => router.push('/')} className="text-xs bg-white text-black px-5 py-2.5 rounded-full font-bold">Kembali</button></div></div>

  const currentGenres = channelGenres[ch.id] || []
  const genreLabel = currentGenres.length > 0 ? currentGenres.map(g => genreLabels[g] || g).join(' & ') : null
  const related = allCh.filter(c => c.id !== ch.id).slice(0, 36)
  const sectionTitle = genreLabel ? 'More ' + genreLabel : 'More Channels'

  return (
    <div className="min-h-screen bg-black text-white tv-shell">
      <Header />
      <div className="pt-[64px] sm:pt-[72px]">
        <div className="max-w-[1500px] mx-auto px-2 sm:px-6">
          <div className={`rounded-none sm:rounded-3xl overflow-hidden ring-1 ring-white/[0.08] bg-black shadow-[0_32px_120px_rgba(0,0,0,.62)] ${playerStatus !== 'Error' ? 'glow-player' : ''}`}>
            <Player ch={ch} onClose={() => router.push('/')} onStatusChange={setPlayerStatus} />
          </div>
        </div>

        <div className="max-w-[1320px] mx-auto px-4 sm:px-8 py-7">
          <div className="flex flex-col lg:flex-row lg:items-start gap-5 lg:gap-8 mb-6">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/[0.07] border border-white/10 flex items-center justify-center text-xl font-black text-white/40 flex-shrink-0 overflow-hidden tv-card-shadow">
                {ch.logo ? <img src={ch.logo} alt={ch.name} className="w-[70%] h-[70%] object-contain" /> : ch.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.18em] ' + (playerStatus === 'Error' ? 'bg-red-400/10 border border-red-400/20 text-red-300' : 'bg-green-400/10 border border-green-400/20 text-green-300')}>
                    <span className={'w-1.5 h-1.5 rounded-full ' + (playerStatus === 'Error' ? 'bg-red-400' : 'bg-green-400')} /> {playerStatus === 'Error' ? 'Error' : 'Live'}</span>
                  {genreLabel && <span className="text-[10px] uppercase tracking-[0.18em] text-white/35">{genreLabel}</span>}
                </div>
                <h1 className="tv-title text-3xl sm:text-5xl font-black leading-none truncate">{ch.name}</h1>
                <p className="text-sm text-white/45 mt-2">{ch.country}{ch.quality ? ' · ' + ch.quality : ''}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap lg:justify-end">
              <button onClick={() => toggleFavorite(ch)} className="inline-flex items-center gap-2 text-xs px-4 py-2.5 rounded-full bg-white/[0.08] border border-white/10 hover:bg-white/[0.14] transition">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill={isFavorite(ch.id) ? '#E50914' : 'none'} stroke={isFavorite(ch.id) ? '#E50914' : '#aaa'} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                {isFavorite(ch.id) ? 'Saved' : 'My List'}
              </button>
              <button onClick={async () => { try { await navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch {} }} className="inline-flex items-center gap-2 text-xs px-4 py-2.5 rounded-full bg-white/[0.08] border border-white/10 hover:bg-white/[0.14] transition">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
                {copied ? 'Copied' : 'Share'}
              </button>
              {genreLabel && <button onClick={() => router.push('/semua?genre=' + currentGenres[0])} className="inline-flex items-center gap-2 text-xs px-4 py-2.5 rounded-full bg-white text-black font-bold hover:bg-[#E50914] hover:text-white transition">All {genreLabel}</button>}
            </div>
          </div>

          {/* EPG Section */}
          {epg && (epg.current || epg.upcoming?.length > 0) && (
            <div className="mb-8 bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-4 h-4 text-[#E50914]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">TV Guide</span>
                {epg.channel?.logo && <img src={epg.channel.logo} alt="" className="h-5 ml-auto" />}
              </div>

              {/* Now Playing */}
              {epg.current && (
                <div className="mb-4 p-4 bg-[#E50914]/10 border border-[#E50914]/20 rounded-xl">
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#E50914] mb-1 block">● On Now</span>
                  <h3 className="text-base sm:text-lg font-bold text-white leading-tight">{epg.current.title}</h3>
                  {epg.current.desc && <p className="text-xs text-white/50 mt-1.5 line-clamp-2">{epg.current.desc}</p>}
                  <span className="text-[10px] text-white/35 mt-2 block">
                    {epg.current.start.slice(9,11)}:{epg.current.start.slice(11,13)} – {epg.current.stop.slice(9,11)}:{epg.current.stop.slice(11,13)}
                  </span>
                </div>
              )}

              {/* Up Next */}
              {epg.upcoming?.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40 mb-3 block">Up Next</span>
                  <div className="space-y-2">
                    {epg.upcoming.slice(0, 5).map((p: any, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-white/[0.04] transition-colors">
                        <span className="text-[10px] text-white/30 tabular-nums whitespace-nowrap mt-0.5 min-w-[40px]">
                          {p.start.slice(9,11)}:{p.start.slice(11,13)}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-white/80 truncate">{p.title}</p>
                          {p.desc && <p className="text-[10px] text-white/35 truncate mt-0.5">{p.desc}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mb-8"><AdBanner slot="watch-bottom" format="banner" link="https://omg10.com/4/11127947" /></div>

          <section>
            <div className="flex items-end justify-between mb-4">
              <div><h2 className="tv-title text-2xl sm:text-3xl font-black">{sectionTitle}</h2><p className="text-xs text-white/35 mt-1">Based on genre, country, and live catalog</p></div>
              <button onClick={() => router.push('/semua')} className="hidden sm:inline-flex text-xs text-white/45 hover:text-white transition">Browse all →</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {related.map(c => <ChannelCard key={c.id} ch={c} health={relatedHealth[c.id]} />)}
            </div>
            <div className="mt-7 text-center"><button onClick={() => router.push('/semua')} className="text-xs text-white/55 hover:text-white bg-white/[0.07] border border-white/10 px-6 py-3 rounded-full transition">View Full Catalog</button></div>
          </section>
        </div>
      </div>
    </div>
  )
}
