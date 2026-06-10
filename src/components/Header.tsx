'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'

interface Channel {
  id: string
  name: string
  country: string
  url: string
  logo?: string
}

const genreLabels: Record<string, string> = {
  'general': 'All', 'news': 'News', 'sports': 'Sports', 'entertainment': 'Entertainment',
  'music': 'Music', 'movies': 'Movies', 'kids': 'Kids', 'religious': 'Religious',
  'education': 'Education', 'documentary': 'Documentary', 'comedy': 'Comedy',
  'culture': 'Culture', 'lifestyle': 'Lifestyle', 'travel': 'Travel',
  'cooking': 'Cooking', 'science': 'Science',
}

export default function Header() {
  const [q, setQ] = useState('')
  const [focused, setFocused] = useState(false)
  const [channels, setChannels] = useState<Channel[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const router = useRouter()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/channels')
      .then(r => r.json())
      .then(d => {
        setChannels(d.channels || [])
        if (d.genres) {
          setCategories(Object.keys(genreLabels).filter(k => d.categories?.[k]?.length > 0))
        }
      })
      .catch(() => {})
  }, [])

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setFocused(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const search = (e: React.FormEvent) => {
    e.preventDefault()
    if (q.trim()) {
      router.push('/semua?q=' + encodeURIComponent(q.trim()))
      setFocused(false)
    }
  }

  const results = q.trim()
    ? channels.filter(c => c.name.toLowerCase().includes(q.toLowerCase())).slice(0, 8)
    : []

  return (
    <header className="sticky top-0 z-50 bg-[#111] border-b border-[#222] px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center gap-4 flex-wrap" ref={ref}>
        <Link href="/" className="text-lg font-bold text-white hover:text-white/80 flex-shrink-0">
          <img src="/logo.png" alt="TVDROP" className="h-7 w-auto" />
        </Link>
        <form onSubmit={search} className="relative flex-1 min-w-[160px] max-w-md">
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder="Cari channel..."
            className="w-full bg-[#1a1a1a] border border-[#222] rounded-full px-3 py-1.5 pl-8 text-xs text-white outline-none focus:border-[#555]"
          />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#555]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </span>

          {/* Dropdown */}
          {focused && (
            <div className="absolute top-full mt-2 left-0 right-0 bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden shadow-xl z-50">
              {q.trim() ? (
                /* Search results */
                <div>
                  {results.length > 0 ? (
                    results.map(ch => (
                      <Link key={ch.id} href={'/watch/' + encodeURIComponent(ch.id)}
                        onClick={() => setFocused(false)}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-[#2a2a2a] transition text-xs">
                        <span className="w-5 h-5 rounded bg-[#333] flex items-center justify-center text-[10px] font-bold text-[#888] flex-shrink-0">
                          {ch.name.charAt(0)}
                        </span>
                        <span className="text-white truncate flex-1">{ch.name}</span>
                        <span className="text-[#555]">{ch.country}</span>
                      </Link>
                    ))
                  ) : (
                    <div className="px-3 py-4 text-center text-[#555] text-xs">Channel tidak ditemukan</div>
                  )}
                  <div className="border-t border-[#333] px-3 py-2">
                    <button
                      onClick={() => { router.push('/semua?q=' + encodeURIComponent(q.trim())); setFocused(false) }}
                      className="w-full text-center text-[11px] text-[#888] hover:text-white transition py-1"
                    >
                      Lihat semua hasil &rarr;
                    </button>
                  </div>
                </div>
              ) : (
                /* Categories when empty */
                <div className="p-3">
                  <p className="text-[10px] text-[#555] uppercase tracking-wider mb-2">Kategori</p>
                  <div className="flex flex-wrap gap-1.5">
                    {categories.map(c => (
                      <Link key={c} href={'/semua?genre=' + c}
                        onClick={() => setFocused(false)}
                        className="text-[11px] px-2.5 py-1 rounded-full bg-[#2a2a2a] text-[#aaa] hover:bg-[#3a3a3a] hover:text-white transition"
                      >
                        {genreLabels[c] || c}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </form>
      </div>
    </header>
  )
}
