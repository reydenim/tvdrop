'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import ChannelGrid from '@/components/ChannelGrid'
import { useFavorites } from '@/lib/useFavorites'

interface Channel {
  id: string
  name: string
  country: string
  quality?: string
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

function SemuaContent() {
  const searchParams = useSearchParams()
  const q = searchParams.get('q') || ''
  const genreParam = searchParams.get('genre') || ''
  const [channels, setChannels] = useState<Channel[]>([])
  const [channelGenres, setChannelGenres] = useState<Record<string, string[]>>({})
  const [countries, setCountries] = useState<string[]>([])
  const [genres, setGenres] = useState<string[]>([])
  const [activeFilter, setActiveFilter] = useState(genreParam || 'Semua')
  const [filterType, setFilterType] = useState<'country' | 'genre'>(genreParam ? 'genre' : 'country')
  const [search, setSearch] = useState(q)
  const [loading, setLoading] = useState(true)
  const { isFavorite } = useFavorites()

  useEffect(() => {
    fetch('/api/channels')
      .then(r => r.json())
      .then(d => {
        setChannels(d.channels)
        setChannelGenres(d.channel_genres || {})
        const cs = [...new Set(d.channels.map((c: Channel) => c.country))].sort() as string[]
        setCountries(cs)
        if (d.genres) {
          setGenres(Object.keys(genreLabels).filter(k => d.categories?.[k]?.length > 0))
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { setSearch(q) }, [q])
  useEffect(() => { if (genreParam) { setActiveFilter(genreParam); setFilterType('genre') } }, [genreParam])

  const filtered = channels.filter(c => {
    if (activeFilter === 'Favorit' && !isFavorite(c.id)) return false
    else if (activeFilter === 'Semua') {}
    else if (filterType === 'country' && c.country !== activeFilter) return false
    else if (filterType === 'genre' && !channelGenres[c.id]?.includes(activeFilter)) return false
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const setFilter = (type: 'country' | 'genre', value: string) => {
    setFilterType(type)
    setActiveFilter(value)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <div className="max-w-7xl mx-auto px-4 pt-4 pb-2">
        {/* Filter bar: Genre pills + Country select */}
        <div className="flex items-center gap-2 pb-1 flex-wrap">
          <button onClick={() => setActiveFilter('Semua')}
            className={'text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition ' + (activeFilter === 'Semua' ? 'bg-white text-black font-semibold' : 'bg-[#1a1a1a] text-[#888] hover:text-white')}>
            Semua
          </button>
          <button onClick={() => { setFilterType('genre'); setActiveFilter('Favorit') }}
            className={'text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition flex items-center gap-1 ' + (activeFilter === 'Favorit' ? 'bg-[#E50914] text-white font-semibold' : 'bg-[#1a1a1a] text-[#888] hover:text-white')}>
            <svg viewBox="0 0 24 24" className="w-3 h-3" fill={activeFilter === 'Favorit' ? 'white' : '#888'}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
            Favorit
          </button>
          {genres.map(g => (
            <button key={g} onClick={() => setFilter('genre', g)}
              className={'text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition ' + (activeFilter === g && filterType === 'genre' ? 'bg-white text-black font-semibold' : 'bg-[#1a1a1a] text-[#888] hover:text-white')}>
              {genreLabels[g] || g}
            </button>
          ))}
          <div className="w-px h-5 bg-[#333] mx-1"></div>
          <select
            value={filterType === 'country' ? activeFilter : ''}
            onChange={e => setFilter('country', e.target.value)}
            className="text-xs px-3 py-1.5 rounded-full bg-[#1a1a1a] text-[#888] border border-[#333] outline-none focus:border-[#555] appearance-none cursor-pointer"
          >
            <option value="">— Negara</option>
            {countries.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <p className="text-[11px] text-[#555] mb-2 mt-2">{filtered.length} channel</p>
      </div>
      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 p-4 sm:gap-4">
          {Array.from({length: 18}).map((_, i) => (
            <div key={i} className="bg-[#1a1a1a] rounded overflow-hidden w-full aspect-[16/9] animate-pulse">
              <div className="w-full h-full bg-[#222] rounded" />
            </div>
          ))}
        </div>
      ) : (
        <ChannelGrid channels={filtered} />
      )}
    </div>
  )
}

export default function SemuaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><span className="dot-pulse"><span>.</span><span>.</span><span>.</span></span></div>}>
      <SemuaContent />
    </Suspense>
  )
}
