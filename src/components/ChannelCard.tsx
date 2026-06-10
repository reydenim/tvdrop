'use client'

import Link from 'next/link'
import { useFavorites } from '@/lib/useFavorites'

interface Channel {
  id: string
  name: string
  country: string
  quality?: string
  url: string
  logo?: string
}

const colors = [
  '#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626',
  '#7c3aed', '#db2777', '#0284c7', '#65a30d', '#ea580c',
  '#0d9488', '#9333ea', '#2563eb', '#ca8a04', '#e11d48',
  '#6366f1', '#14b8a6', '#84cc16', '#f97316', '#ec4899',
]

function hashColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = ((h << 5) - h) + name.charCodeAt(i), h |= 0
  return colors[Math.abs(h) % colors.length]
}

export default function ChannelCard({ ch }: { ch: Channel }) {
  const initial = ch.name.charAt(0).toUpperCase()
  const color = hashColor(ch.name)
  const { isFavorite, toggleFavorite } = useFavorites()
  const fav = isFavorite(ch.id)

  return (
    <Link
      href={'/watch/' + encodeURIComponent(ch.id)}
      className="block group relative bg-[#1a1a1a] rounded overflow-hidden w-full aspect-[16/9] transition-transform duration-300 hover:scale-105 hover:z-10 hover:shadow-[0_8px_30px_rgba(229,9,20,.15)] hover:ring-1 hover:ring-[#E50914]/30"
    >
      {/* Logo area */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: ch.logo ? '#141414' : color }}>
        {ch.logo ? (
          <img src={ch.logo} alt={ch.name} className="w-1/2 h-1/2 object-contain" loading="lazy"
            onError={e => { const t = e.target as HTMLImageElement; t.style.display = 'none'; const p = t.parentElement!; p.style.backgroundColor = color; const s = document.createElement('span'); s.className = 'text-white font-bold text-2xl'; s.textContent = initial; p.appendChild(s) }}
          />
        ) : (
          <span className="text-white font-bold text-2xl sm:text-3xl">{initial}</span>
        )}
      </div>

      {/* Favorite button */}
      <button
        onClick={e => { e.preventDefault(); e.stopPropagation(); toggleFavorite(ch) }}
        className="absolute top-1.5 right-1.5 z-20 w-7 h-7 rounded-full bg-black/40 flex items-center justify-center transition hover:scale-110"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill={fav ? '#E50914' : 'none'} stroke={fav ? '#E50914' : 'white'} strokeWidth="2">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
        </svg>
      </button>

      {/* Hover play overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#E50914] flex items-center justify-center shadow-lg">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-6 sm:h-6 text-white ml-0.5"><path d="M8 5v14l11-7z"/></svg>
        </div>
      </div>

      {/* Bottom gradient + name */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2.5 pt-6">
        <p className="text-xs sm:text-sm font-medium text-white line-clamp-1 drop-shadow-md">{ch.name}</p>
      </div>
    </Link>
  )
}

export { hashColor }
