'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
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

interface Data {
  channels: Channel[]
  curated: string[]
  categories: Record<string, string[]>
  genres: string[]
  channel_genres: Record<string, string[]>
}

export default function HomePage() {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const { favorites } = useFavorites()
  const [heroIdx, setHeroIdx] = useState(0)
  const [touchX, setTouchX] = useState(0)

  useEffect(() => {
    fetch('/api/channels')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!data) return
    const slides = (data.curated.map(id => data.channels.find(c => c.id === id)).filter(Boolean) as Channel[]).slice(0, 6)
    if (slides.length < 2) return
    const timer = setInterval(() => setHeroIdx(i => (i + 1) % slides.length), 6000)
    return () => clearInterval(timer)
  }, [data])

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><span className="dot-pulse"><span>.</span><span>.</span><span>.</span></span></div>
  if (!data) return <div className="min-h-screen bg-black text-center text-[#555] pt-20 text-sm">Gagal load data</div>

  const getChannels = (prefixes: string[]) =>
    data.channels.filter(c => prefixes.some(p => c.name.startsWith(p)))

  const curated = data.curated.map(id => data.channels.find(c => c.id === id)).filter(Boolean) as Channel[]
  const slides = curated.slice(0, 6)
  const s = slides[heroIdx] || slides[0]

  const goHero = (i: number) => setHeroIdx((i + slides.length) % slides.length)

  const genreLabels: Record<string, string> = {
    'general': 'All', 'news': 'News', 'sports': 'Sports', 'entertainment': 'Entertainment',
    'music': 'Music', 'movies': 'Movies', 'kids': 'Kids', 'religious': 'Religious',
    'education': 'Education', 'documentary': 'Documentary', 'comedy': 'Comedy',
    'culture': 'Culture', 'lifestyle': 'Lifestyle', 'travel': 'Travel',
    'cooking': 'Cooking', 'science': 'Science',
  }

  const sections: { title: string; channels: Channel[] }[] = [
    ...(favorites.length > 0 ? [{ title: 'Favorit', channels: favorites }] : []),
    { title: 'Channel Populer', channels: curated },
    ...Object.entries(genreLabels).map(([key, label]) => ({
      title: label,
      channels: (data.categories as Record<string, string[]>)[key]?.map((name: string) =>
        data.channels.find((c: Channel) => c.name === name)
      ).filter(Boolean) as Channel[] || []
    })),
    { title: 'Indonesia', channels: data.channels.filter(c => c.country === 'Indonesia').slice(0, 36) },
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      {/* Hero Carousel */}
      <div className="relative h-[50vh] min-h-[320px] max-h-[500px] overflow-hidden group/carousel">
        {/* Slides */}
        {slides.map((slide, i) => (
          <div key={slide.id}
            className={'absolute inset-0 transition-opacity duration-500 ' + (i === heroIdx ? 'opacity-100' : 'opacity-0 pointer-events-none')}
          >
            <div className="absolute inset-0 flex items-center justify-center bg-[#111]"
              onTouchStart={e => setTouchX(e.touches[0].clientX)}
              onTouchEnd={e => {
                const diff = touchX - e.changedTouches[0].clientX
                if (Math.abs(diff) > 50) goHero(heroIdx + (diff > 0 ? 1 : -1))
              }}
            >
              {slide.logo
                ? <img src={slide.logo} alt={slide.name} className="w-32 h-32 sm:w-40 sm:h-40 object-contain opacity-40" />
                : <div className="w-24 h-24 rounded-2xl bg-[#1e1e1e] flex items-center justify-center text-5xl font-bold text-[#333]">{slide.name.charAt(0).toUpperCase()}</div>
              }
            </div>
          </div>
        ))}

        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent z-10 pointer-events-none" />

        {/* Arrows */}
        {slides.length > 1 && (
          <>
            <button onClick={() => goHero(heroIdx - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-black/60">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <button onClick={() => goHero(heroIdx + 1)} className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-black/60">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </>
        )}

        {/* Info */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-6 pb-12 sm:p-10 max-w-4xl">
          <p className="text-xs text-[#888] uppercase tracking-wider mb-1">Live TV</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 drop-shadow-lg">{s.name}</h2>
          <p className="text-sm text-gray-300 mb-4 max-w-xl">{s.country} · {s.quality || 'Live'} channel</p>
          <Link
            href={'/watch/' + encodeURIComponent(s.id)}
            className="inline-flex items-center gap-2 bg-[#E50914] text-white px-6 py-2.5 rounded font-semibold text-sm hover:bg-[#f40612] transition shadow-lg shadow-red-700/30"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M8 5v14l11-7z"/></svg>
            Tonton
          </Link>
          {/* Dots */}
          {slides.length > 1 && (
            <div className="flex gap-1.5 mt-4">
              {slides.map((_, i) => (
                <button key={i} onClick={() => setHeroIdx(i)}
                  className={'w-2 h-2 rounded-full transition-all ' + (i === heroIdx ? 'bg-white w-5' : 'bg-white/30 hover:bg-white/50')}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content Rows */}
      <div className="relative z-30 mt-2 sm:mt-6">
        {sections.map((sec, i) => sec.channels.length > 0 && (
          <section key={i} className="mb-6">
            <div className="flex items-center justify-between px-4 sm:px-6 mb-3">
              <h2 className="text-base sm:text-lg font-bold">{sec.title}</h2>
              <Link href={'/semua?country=' + sec.title} className="text-xs text-[#666] hover:text-[#E50914] transition">Lihat Semua</Link>
            </div>
            <div className="flex gap-2 overflow-x-auto px-4 sm:px-6 pb-3" style={{ scrollbarWidth: 'thin', scrollbarColor: '#333 transparent' }}>
              {sec.channels.map(ch => (
                <div key={ch.id} className="flex-shrink-0 w-[140px] sm:w-[180px] md:w-[200px] lg:w-[220px]">
                  <ChannelCard ch={ch} />
                </div>
              ))}
              <div className="flex-shrink-0 w-8 flex items-center justify-center">
                <Link href={'/semua?country=' + sec.title} className="text-[#555] hover:text-white text-xs transition">&rarr;</Link>
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* Footer */}
      <footer className="border-t border-[#222] px-4 sm:px-6 py-8 mt-8">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm font-bold mb-1 flex items-center gap-2"><img src="/logo.png" alt="TVDROP" className="h-5 w-auto" /></p>
          <p className="text-[11px] text-[#555]">{data.channels.length} channel · Indonesia & Internasional</p>
        </div>
      </footer>
    </div>
  )
}
