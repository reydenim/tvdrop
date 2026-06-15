'use client'

import { useRef, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useFavorites } from '@/lib/useFavorites'

interface Channel { id: string; name: string; country: string; quality?: string; url: string; logo?: string }

// Session-level dead-channel tracker (player error → hide badge immediately)
const SESSION_DEAD = new Set<string>()
export function markSessionDead(id: string) { SESSION_DEAD.add(id) }

const colors = ['#4f46e5','#0891b2','#059669','#d97706','#dc2626','#7c3aed','#db2777','#0284c7','#65a30d','#ea580c','#0d9488','#9333ea','#2563eb','#ca8a04','#e11d48','#6366f1','#14b8a6','#84cc16','#f97316','#ec4899']

function hashColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = ((h << 5) - h) + name.charCodeAt(i), h |= 0
  return colors[Math.abs(h) % colors.length]
}

export default function ChannelCard({ ch, health }: { ch: Channel; health?: string }) {
  const initial = ch.name.charAt(0).toUpperCase()
  const color = hashColor(ch.name)
  const { isFavorite, toggleFavorite } = useFavorites()
  const fav = isFavorite(ch.id)
  const isDead = health === 'dead' || health === 'geo-blocked' || SESSION_DEAD.has(ch.id)
  const ref = useRef<HTMLAnchorElement>(null)

  const tilt = useCallback((e: React.MouseEvent) => {
    const el = ref.current; if (!el) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    el.style.setProperty('--mx', (e.clientX - r.left) / r.width * 100 + '%')
    el.style.setProperty('--my', (e.clientY - r.top) / r.height * 100 + '%')
    el.style.transform = `perspective(800px) rotateY(${x * 12}deg) rotateX(${-y * 8}deg) scale(1.06)`
  }, [])

  const untilt = useCallback(() => {
    const el = ref.current; if (!el) return
    el.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg) scale(1)'
  }, [])

  return (
    <Link
      ref={ref}
      href={'/watch/' + encodeURIComponent(ch.id)}
      onMouseMove={tilt}
      onMouseLeave={untilt}
      className="block group relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-[#111116] ring-1 ring-white/[0.07] tv-card-shadow transition duration-300 hover:z-20 hover:ring-white/25"
      style={{ transform: 'perspective(800px) rotateY(0deg) rotateX(0deg) scale(1)', transition: 'transform 0.2s ease-out, box-shadow 0.3s, ring 0.3s' }}
    >
      <div className="absolute inset-0 flex items-center justify-center" style={{ background: ch.logo ? 'linear-gradient(135deg,#111116,#08080a)' : `radial-gradient(circle at 30% 20%, ${color}, #0b0b0d 72%)` }}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,.14),transparent_45%)]" />
        {ch.logo ? (
          <img src={ch.logo} alt={ch.name} className="relative w-[46%] h-[46%] object-contain opacity-90 drop-shadow-[0_10px_22px_rgba(0,0,0,.55)] transition duration-500 group-hover:scale-110 group-hover:opacity-100" loading="lazy"
            onError={e => { const t = e.target as HTMLImageElement; t.style.display = 'none'; const p = t.parentElement!; p.style.background = color; const s = document.createElement('span'); s.className = 'text-white font-black text-3xl'; s.textContent = initial; p.appendChild(s) }}
          />
        ) : (
          <span className="relative text-white font-black text-3xl sm:text-4xl drop-shadow-lg">{initial}</span>
        )}
      </div>

      {/* Glare overlay */}
      <div className="card-glare" style={{ borderRadius: '0.75rem' }} />

      {/* Favorite button */}
      <button
        onClick={e => { e.preventDefault(); e.stopPropagation(); toggleFavorite(ch) }}
        className="absolute top-2 right-2 z-20 w-8 h-8 rounded-full bg-black/45 backdrop-blur-md border border-white/10 flex items-center justify-center transition hover:scale-110 hover:bg-black/70"
        aria-label="Toggle favorite"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill={fav ? '#E50914' : 'none'} stroke={fav ? '#E50914' : 'white'} strokeWidth="2">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
        </svg>
      </button>

      {/* Live badge */}
      {!isDead && (
        <div className="absolute top-2 left-2 z-20">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/55 backdrop-blur-md border border-white/10 text-[9px] font-semibold text-green-300 uppercase tracking-[0.14em]">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,.7)]" /> Live
          </span>
        </div>
      )}

      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/18 transition duration-500" />
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 bg-gradient-to-t from-black via-black/18 to-transparent" />

      <div className="absolute left-3 bottom-3 right-3 translate-y-1 group-hover:translate-y-0 transition duration-500">
        <div className="flex items-center gap-2 mb-2 opacity-0 group-hover:opacity-100 transition duration-500">
          <span className="w-9 h-9 rounded-full bg-[#E50914] flex items-center justify-center tv-red-glow">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white ml-0.5"><path d="M8 5v14l11-7z"/></svg>
          </span>
          <span className="text-[10px] uppercase tracking-[0.18em] text-white/55">Live</span>
        </div>
        <p className="text-xs sm:text-sm font-semibold text-white line-clamp-1 drop-shadow-md">{ch.name}</p>
        <p className="text-[10px] text-white/42 mt-0.5 line-clamp-1">{ch.country}{ch.quality ? ` · ${ch.quality}` : ''}</p>
      </div>
    </Link>
  )
}

export { hashColor }
