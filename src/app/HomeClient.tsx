'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import ChannelCard from '@/components/ChannelCard'
import AdBanner from '@/components/AdBanner'
import WorldCupBanner from '@/components/WorldCupBanner'
import { useFavorites } from '@/lib/useFavorites'

export interface Channel { id: string; name: string; country: string; quality?: string; url: string; logo?: string }
export interface HomeSection { title: string; channels: string[]; link?: string }
export interface HomeData { channels: Channel[]; curatedIds: string[]; curated: string[]; sections: HomeSection[]; totalChannels?: number; health?: Record<string, string>; wcMatches?: any[] }

export default function HomeClient({ data }: { data: HomeData }) {
  const { favorites } = useFavorites()
  const [heroIdx, setHeroIdx] = useState(0)
  const [touchX, setTouchX] = useState(0)
  const [mx, setMx] = useState(0); const [my, setMy] = useState(0)
  const heroRef = useRef<HTMLElement>(null)
  const channelById = new Map(data.channels.map(c => [c.id, c]))
  const curatedChannels = data.curated.map(id => channelById.get(id)).filter(Boolean) as Channel[]
  const slides = curatedChannels.slice(0, 6)
  const s = slides[heroIdx] || slides[0]

  useEffect(() => {
    if (slides.length < 2) return
    const timer = setInterval(() => setHeroIdx(i => (i + 1) % slides.length), 6500)
    return () => clearInterval(timer)
  }, [slides.length])

  // Parallax mouse tracking
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const w = window.innerWidth, h = window.innerHeight
      setMx((e.clientX / w - 0.5) * 10); setMy((e.clientY / h - 0.5) * 10)
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  // Scroll reveal
  useEffect(() => {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in') } })
    }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' })
    document.querySelectorAll('.sr').forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [data])

  const goHero = (i: number) => setHeroIdx((i + slides.length) % slides.length)

  const sections: { title: string; channels: Channel[]; link?: string }[] = [
    ...(favorites.length > 0 ? [{ title: 'My List', channels: favorites.slice(0, 20), link: '/semua?genre=Favorit' }] : []),
    ...data.sections.map(sec => ({ title: sec.title, channels: sec.channels.map(id => channelById.get(id)).filter(Boolean) as Channel[], link: sec.link })),
  ]

  if (!s) return <div className="min-h-screen bg-black flex items-center justify-center"><span className="dot-pulse"><span>.</span><span>.</span><span>.</span></span></div>

  return (
    <div className="min-h-screen bg-black text-white tv-shell">
      <Header />

      <section ref={heroRef} className="relative h-[78vh] min-h-[560px] max-h-[860px] overflow-hidden group/hero">
        {slides.map((slide, i) => (
          <div key={slide.id} className={'absolute inset-0 transition-opacity duration-1000 ' + (i === heroIdx ? 'opacity-100' : 'opacity-0 pointer-events-none')}>
            <div
              className="absolute inset-0 flex items-center justify-center"
              onTouchStart={e => setTouchX(e.touches[0].clientX)}
              onTouchEnd={e => { const diff = touchX - e.changedTouches[0].clientX; if (Math.abs(diff) > 50) goHero(heroIdx + (diff > 0 ? 1 : -1)) }}
            >
              <div className="absolute inset-0 bg-[#060606]" />
              {slide.logo ? (
                <img src={slide.logo} alt={slide.name}
                  className="absolute right-[8vw] top-1/2 -translate-y-1/2 w-[34vw] max-w-[520px] min-w-[240px] aspect-square object-contain opacity-[0.32] blur-[1px] scale-110 transition-transform duration-300"
                  style={{ transform: `translate(calc(-50% + ${-mx * 5}px), calc(-50% + ${-my * 3}px))` }} />
              ) : (
                <div className="absolute right-[12vw] top-1/2 -translate-y-1/2 text-[28vw] font-black text-white/[0.05] leading-none"
                  style={{ transform: `translate(${-mx * 3}px, ${-my * 2}px)` }}>{slide.name.charAt(0).toUpperCase()}</div>
              )}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_40%,rgba(229,9,20,.22),transparent_35%),linear-gradient(90deg,#000_0%,rgba(0,0,0,.88)_24%,rgba(0,0,0,.52)_52%,rgba(0,0,0,.2)_100%)]" />
              <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black via-black/75 to-transparent" />
            </div>
          </div>
        ))}

        {slides.length > 1 && (
          <>
            <button onClick={() => goHero(heroIdx - 1)} className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-10 h-16 rounded-xl bg-black/25 border border-white/10 text-white/70 flex items-center justify-center opacity-0 group-hover/hero:opacity-100 transition hover:bg-black/55 hover:text-white backdrop-blur-md">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <button onClick={() => goHero(heroIdx + 1)} className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-10 h-16 rounded-xl bg-black/25 border border-white/10 text-white/70 flex items-center justify-center opacity-0 group-hover/hero:opacity-100 transition hover:bg-black/55 hover:text-white backdrop-blur-md">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </>
        )}

        {/* Parallax logo layer — subtle shift with mouse */}
        <div className="absolute bottom-16 sm:bottom-20 left-0 right-0 z-20 px-5 sm:px-10 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 backdrop-blur-md text-[10px] uppercase tracking-[0.24em] text-white/70 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_14px_rgba(74,222,128,.8)]" /> Live now
          </div>
          <h1 className="tv-title text-5xl sm:text-7xl md:text-8xl font-black leading-[0.9] drop-shadow-2xl max-w-[900px]">{s.name}</h1>
          <p className="text-sm sm:text-base text-white/62 mt-4 max-w-xl">{s.country} · {s.quality || 'Live channel'} · Watch instantly on TVDROP</p>
          <div className="flex items-center gap-3 mt-7 flex-wrap">
            <Link href={'/watch/' + encodeURIComponent(s.id)} className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-bold text-sm hover:bg-white/85 transition shadow-[0_16px_50px_rgba(255,255,255,.18)]">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M8 5v14l11-7z"/></svg>
              Play
            </Link>
            <Link href="/semua" className="inline-flex items-center gap-2 bg-white/10 border border-white/12 text-white px-6 py-3 rounded-full font-semibold text-sm hover:bg-white/18 transition backdrop-blur-md">Browse All</Link>
          </div>
          <div className="flex gap-1.5 mt-7">
            {slides.map((_, i) => <button key={i} onClick={() => setHeroIdx(i)} className={'h-1 rounded-full transition-all ' + (i === heroIdx ? 'bg-white w-10' : 'bg-white/25 hover:bg-white/50 w-5')} />)}
          </div>
        </div>
      </section>

      <main className="relative z-10 -mt-10 sm:-mt-14 pb-10">
        <div className="px-4 sm:px-8 mb-8">
          <AdBanner slot="home-top" format="leaderboard" link="https://omg10.com/4/11127947" />
        </div>

        {/* World Cup 2026 Schedule */}
        {data.wcMatches && data.wcMatches.length > 0 && (
          <WorldCupBanner matches={data.wcMatches} />
        )}

        {sections.map((sec, i) => sec.channels.length > 0 && (
          <section key={i} className="mb-9 sm:mb-11 sr" style={{ transitionDelay: i * 80 + 'ms' }}>
            <div className="flex items-end justify-between px-4 sm:px-8 mb-3">
              <div>
                <Link href={sec.link || '/semua'} className="tv-title text-xl sm:text-2xl font-black hover:text-[#E50914] transition">{sec.title}</Link>
                <p className="hidden sm:block text-xs text-white/30 mt-1">Curated live channels ready to watch</p>
              </div>
              <Link href={sec.link || '/semua'} className="text-xs text-white/38 hover:text-white transition">View all →</Link>
            </div>
            <div className="tv-rail flex gap-3 sm:gap-4 overflow-x-auto px-4 sm:px-8 pb-5 pt-1">
              {sec.channels.map(ch => (
                <div key={ch.id} className="flex-shrink-0 w-[160px] sm:w-[236px] md:w-[276px] lg:w-[320px] xl:w-[360px] scroll-snap-align-start">
                  <ChannelCard ch={ch} health={data.health?.[ch.id]} />
                </div>
              ))}
              <div className="flex-shrink-0 w-10 flex items-center justify-center">
                <Link href={sec.link || '/semua'} className="w-9 h-9 rounded-full bg-white/8 border border-white/10 text-white/45 hover:text-white hover:bg-white/15 transition flex items-center justify-center">→</Link>
              </div>
            </div>
          </section>
        ))}

        {sections.filter(s => s.channels.length > 0).length > 3 && (
          <div className="px-4 sm:px-8 mb-8">
            <AdBanner slot="home-mid" format="banner" link="https://omg10.com/4/11127947" />
          </div>
        )}
      </main>

      <footer className="border-t border-white/[0.06] px-4 sm:px-8 py-9 mt-8 bg-black/40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 text-xs text-white/30">
          <div>
            <img src="/logo.png" alt="TVDROP" className="h-5 w-auto mb-2 opacity-80" />
            <p>{data.totalChannels || data.channels.length}+ channels · Indonesia & International</p>
          </div>
          <div className="flex items-center gap-5 flex-wrap">
            <Link href="/semua?genre=cctv" className="hover:text-white transition flex items-center gap-1">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
              CCTV World
            </Link>
            <Link href="/olahraga" className="hover:text-white transition">Sports</Link>
            <Link href="/semua" className="hover:text-white transition">Browse All</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
