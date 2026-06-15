'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'

interface Channel {
  id: string
  name: string
  country: string
  url?: string
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
    fetch('/api/channels?lite=1&limit=1200')
      .then(r => r.json())
      .then(d => {
        setChannels(d.channels || [])
        setCategories((d.genres || []).filter((k: string) => genreLabels[k] && d.categories?.[k]?.length > 0))
      })
      .catch(() => {})
  }, [])

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
    <header className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-6 py-3 bg-gradient-to-b from-black/90 via-black/55 to-transparent backdrop-blur-md">
      <div className="max-w-[1600px] mx-auto flex items-center gap-3 sm:gap-5" ref={ref}>
        <Link href="/" className="flex-shrink-0 group">
          <img src="/logo.png" alt="TVDROP" className="h-6 sm:h-7 w-auto transition duration-300 group-hover:drop-shadow-[0_0_18px_rgba(229,9,20,.65)]" />
        </Link>

        <nav className="hidden md:flex items-center gap-5 text-xs font-medium text-white/70">
          <Link href="/" className="hover:text-white transition">Home</Link>
          <Link href="/semua" className="hover:text-white transition">Browse</Link>
          <Link href="/olahraga" className="hover:text-white transition">Sports</Link>
          <Link href="/semua?genre=cctv" className="hover:text-white transition flex items-center gap-1">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
            CCTV
          </Link>
        </nav>

        <form onSubmit={search} className="relative flex-1 max-w-xl ml-auto">
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder="Search channels, genres, countries..."
            className="w-full bg-white/[0.07] border border-white/10 rounded-full px-4 py-2 pl-10 text-xs sm:text-sm text-white placeholder:text-white/35 outline-none focus:border-white/35 focus:bg-white/[0.1] transition shadow-[inset_0_1px_0_rgba(255,255,255,.04)]"
          />
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </span>

          {focused && (
            <div className="absolute top-full mt-3 left-0 right-0 tv-glass rounded-2xl overflow-hidden z-50">
              {q.trim() ? (
                <div>
                  {results.length > 0 ? results.map(ch => (
                    <Link key={ch.id} href={'/watch/' + encodeURIComponent(ch.id)}
                      onClick={() => setFocused(false)}
                      className="flex items-center gap-3 px-3 py-3 hover:bg-white/[0.08] transition text-xs border-b border-white/[0.04] last:border-b-0">
                      <span className="w-9 h-9 rounded-lg bg-white/[0.08] flex items-center justify-center overflow-hidden flex-shrink-0">
                        {ch.logo ? <img src={ch.logo} alt="" className="w-6 h-6 object-contain" /> : <span className="text-white/60 font-bold">{ch.name.charAt(0)}</span>}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-white font-semibold truncate">{ch.name}</span>
                        <span className="block text-white/35 mt-0.5">{ch.country}</span>
                      </span>
                    </Link>
                  )) : <div className="px-3 py-6 text-center text-white/35 text-xs">No channel found</div>}
                  <button type="button" onClick={() => { router.push('/semua?q=' + encodeURIComponent(q.trim())); setFocused(false) }}
                    className="w-full text-center text-xs text-white/55 hover:text-white transition py-3 bg-white/[0.03]">
                    View all results →
                  </button>
                </div>
              ) : (
                <div className="p-4">
                  <p className="text-[10px] text-white/35 uppercase tracking-[0.24em] mb-3">Browse genres</p>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(c => (
                      <Link key={c} href={'/semua?genre=' + c} onClick={() => setFocused(false)}
                        className="text-[11px] px-3 py-1.5 rounded-full bg-white/[0.07] text-white/65 hover:bg-white/15 hover:text-white transition">
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
