'use client'

import { useEffect, useState, Suspense, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import Header from '@/components/Header'
import ChannelGrid from '@/components/ChannelGrid'
import { useFavorites } from '@/lib/useFavorites'

interface Channel { id: string; name: string; country: string; quality?: string; url: string; logo?: string }
const genreLabels: Record<string, string> = { general:'All', news:'News', sports:'Sports', entertainment:'Entertainment', music:'Music', movies:'Movies', kids:'Kids', religious:'Religious', education:'Education', documentary:'Documentary', comedy:'Comedy', culture:'Culture', lifestyle:'Lifestyle', travel:'Travel', cooking:'Cooking', science:'Science' }
const PAGE_SIZE = 60

function SemuaContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const q = searchParams.get('q') || ''
  const genreParam = searchParams.get('genre') || ''
  const countryParam = searchParams.get('country') || ''
  const pageParam = Math.max(1, parseInt(searchParams.get('page') || '1'))

  const [channels, setChannels] = useState<Channel[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(pageParam)
  const [pageCache, setPageCache] = useState<Record<number, Channel[]>>({})
  const [pageCount, setPageCount] = useState(0)
  const [channelGenres, setChannelGenres] = useState<Record<string, string[]>>({})
  const [countries, setCountries] = useState<string[]>([])
  const [genres, setGenres] = useState<string[]>([])
  const [activeFilter, setActiveFilter] = useState(genreParam || countryParam || 'Semua')
  const [filterType, setFilterType] = useState<'country' | 'genre'>(countryParam ? 'country' : (genreParam ? 'genre' : 'country'))
  const [search, setSearch] = useState(q)
  const [healthMap, setHealthMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const { isFavorite } = useFavorites()

  // Build API URL with current filters
  const buildApiUrl = useCallback((targetPage: number) => {
    const params = new URLSearchParams()
    params.set('limit', String(PAGE_SIZE))
    params.set('offset', String((targetPage - 1) * PAGE_SIZE))
    if (search) params.set('q', search)
    if (filterType === 'country' && activeFilter !== 'Semua' && activeFilter !== 'Favorit') params.set('country', activeFilter)
    if (filterType === 'genre' && activeFilter !== 'Semua' && activeFilter !== 'Favorit') params.set('genre', activeFilter)
    return `/api/channels?${params.toString()}`
  }, [search, filterType, activeFilter])

  // Update URL when filter changes
  const updateUrl = useCallback((newPage: number, newFilter?: string, newType?: 'country' | 'genre') => {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    const f = newFilter !== undefined ? newFilter : activeFilter
    const t = newType !== undefined ? newType : filterType
    if (f !== 'Semua' && f !== 'Favorit') {
      if (t === 'country') params.set('country', f)
      else params.set('genre', f)
    }
    if (newPage > 1) params.set('page', String(newPage))
    const qs = params.toString()
    router.replace(`${pathname}${qs ? '?' + qs : ''}`, { scroll: false })
  }, [search, activeFilter, filterType, router, pathname])

  // Fetch function for a specific page
  const fetchPage = useCallback(async (targetPage: number) => {
    // Use cache if available
    const cacheKey = `${buildApiUrl(targetPage)}`
    if (pageCache[targetPage]) {
      setChannels(pageCache[targetPage])
      setPage(targetPage)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const r = await fetch(cacheKey)
      const d = await r.json()
      setChannels(d.channels)
      setTotal(d.total)
      setPageCount(Math.ceil(d.total / PAGE_SIZE))
      setHealthMap(d.health || {})
      setChannelGenres(d.channel_genres || {})
      // Load countries + genres from first page (or if not loaded yet)
      if (countries.length === 0) {
        // Get all countries via lite endpoint
        fetch('/api/channels?lite=1').then(rr => rr.json()).then(dd => {
          setCountries([...new Set(dd.channels.map((c: Channel) => c.country))].sort() as string[])
          if (dd.genres) setGenres(Object.keys(genreLabels).filter(k => dd.categories?.[k]?.length > 0))
        })
      }
      setPage(targetPage)
      setPageCache(prev => ({ ...prev, [targetPage]: d.channels }))
      setLoading(false)
    } catch {
      setLoading(false)
    }
  }, [buildApiUrl, pageCache, countries.length])

  // Initial load + on filter change
  useEffect(() => {
    setPageCache({}) // invalidate cache on filter change
    fetchPage(pageParam)
  }, [search, filterType, activeFilter])

  // On page param change (e.g. browser back/forward)
  useEffect(() => {
    if (pageParam !== page) fetchPage(pageParam)
  }, [pageParam])

  // Scroll to top on page change
  useEffect(() => {
    if (typeof window !== 'undefined' && page > 1) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [page])

  // Apply Favorit filter client-side
  const displayChannels = activeFilter === 'Favorit'
    ? channels.filter(c => isFavorite(c.id))
    : channels

  const setFilter = (type: 'country' | 'genre', value: string) => {
    setFilterType(type)
    setActiveFilter(value)
    updateUrl(1, value, type)
  }

  const handleSearch = (newSearch: string) => {
    setSearch(newSearch)
    updateUrl(1)
  }

  const goToPage = (newPage: number) => {
    if (newPage < 1 || newPage > pageCount) return
    updateUrl(newPage)
    fetchPage(newPage)
  }

  // Page number buttons (max 5 visible)
  const renderPageButtons = () => {
    const buttons: number[] = []
    const max = 5
    let start = Math.max(1, page - Math.floor(max / 2))
    let end = Math.min(pageCount, start + max - 1)
    if (end - start < max - 1) start = Math.max(1, end - max + 1)
    for (let i = start; i <= end; i++) buttons.push(i)
    return buttons
  }

  return (
    <div className="min-h-screen bg-black text-white tv-shell">
      <Header />
      <main className="pt-24 sm:pt-28 max-w-[1600px] mx-auto px-4 sm:px-8 pb-12">
        <section className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-6">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-[#E50914] font-bold mb-3">TVDROP Catalog</p>
              <h1 className="tv-title text-4xl sm:text-6xl font-black leading-none">Browse Channels</h1>
              <p className="text-white/42 text-sm mt-3">
                Showing <span className="text-white font-bold">{displayChannels.length}</span> of <span className="text-white font-bold">{total.toLocaleString()}</span> channels
                {pageCount > 1 && <> · Page <span className="text-white font-bold">{page}</span> of <span className="text-white font-bold">{pageCount}</span></>}
                {search ? <> · matching "<span className="text-white font-bold">{search}</span>"</> : ''}
              </p>
            </div>
            <div className="tv-glass rounded-2xl p-2 flex items-center gap-2 w-full lg:w-auto">
              <input
                value={search}
                onChange={e => handleSearch(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSearch(search) }}
                placeholder="Search channels..."
                className="flex-1 lg:w-72 bg-transparent px-3 py-2 text-sm outline-none text-white placeholder:text-white/28"
              />
              {search && <button onClick={() => handleSearch('')} className="w-8 h-8 rounded-full bg-white/10 text-white/55 hover:text-white hover:bg-white/15 transition">×</button>}
            </div>
          </div>

          <div className="tv-rail flex items-center gap-2 overflow-x-auto pb-3">
            <button onClick={() => { setFilterType('country'); setActiveFilter('Semua'); updateUrl(1, 'Semua', 'country') }} className={'text-xs px-4 py-2 rounded-full whitespace-nowrap transition border ' + (activeFilter === 'Semua' ? 'bg-white text-black border-white font-bold' : 'bg-white/[0.06] text-white/55 border-white/10 hover:text-white hover:bg-white/[0.1]')}>Semua</button>
            <button onClick={() => { setFilter('genre', 'Favorit') }} className={'text-xs px-4 py-2 rounded-full whitespace-nowrap transition border inline-flex items-center gap-1.5 ' + (activeFilter === 'Favorit' ? 'bg-[#E50914] text-white border-[#E50914] font-bold' : 'bg-white/[0.06] text-white/55 border-white/10 hover:text-white hover:bg-white/[0.1]')}>
              <svg viewBox="0 0 24 24" className="w-3 h-3" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
              My List
            </button>
            {genres.map(g => <button key={g} onClick={() => setFilter('genre', g)} className={'text-xs px-4 py-2 rounded-full whitespace-nowrap transition border ' + (activeFilter === g && filterType === 'genre' ? 'bg-white text-black border-white font-bold' : 'bg-white/[0.06] text-white/55 border-white/10 hover:text-white hover:bg-white/[0.1]')}>{genreLabels[g] || g}</button>)}
            <select value={filterType === 'country' ? activeFilter : ''} onChange={e => setFilter('country', e.target.value)} className="text-xs px-4 py-2 rounded-full bg-white/[0.06] text-white/55 border border-white/10 outline-none focus:border-white/35 appearance-none cursor-pointer">
              <option value="">— Country</option>{countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </section>

        {loading ? <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">{Array.from({length: 24}).map((_, i) => <div key={i} className="bg-white/[0.06] rounded-xl overflow-hidden w-full aspect-[16/9] animate-pulse" />)}</div> : <ChannelGrid channels={displayChannels} health={healthMap} />}

        {/* Pagination */}
        {pageCount > 1 && (
          <nav className="mt-10 flex flex-wrap items-center justify-center gap-1.5" aria-label="Pagination">
            <button onClick={() => goToPage(1)} disabled={page === 1} className="text-xs px-3 py-2 rounded-lg bg-white/[0.06] text-white/65 border border-white/10 hover:bg-white/[0.12] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition">« First</button>
            <button onClick={() => goToPage(page - 1)} disabled={page === 1} className="text-xs px-3 py-2 rounded-lg bg-white/[0.06] text-white/65 border border-white/10 hover:bg-white/[0.12] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition">‹ Prev</button>
            {page > 3 && <span className="text-white/35 px-2">…</span>}
            {renderPageButtons().map(p => (
              <button key={p} onClick={() => goToPage(p)} className={'text-xs min-w-[2.25rem] px-3 py-2 rounded-lg border transition ' + (p === page ? 'bg-white text-black border-white font-bold' : 'bg-white/[0.06] text-white/65 border-white/10 hover:bg-white/[0.12] hover:text-white')}>{p}</button>
            ))}
            {page < pageCount - 2 && <span className="text-white/35 px-2">…</span>}
            <button onClick={() => goToPage(page + 1)} disabled={page === pageCount} className="text-xs px-3 py-2 rounded-lg bg-white/[0.06] text-white/65 border border-white/10 hover:bg-white/[0.12] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition">Next ›</button>
            <button onClick={() => goToPage(pageCount)} disabled={page === pageCount} className="text-xs px-3 py-2 rounded-lg bg-white/[0.06] text-white/65 border border-white/10 hover:bg-white/[0.12] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition">Last »</button>
            <span className="text-xs text-white/35 ml-3 hidden sm:inline">/ {pageCount} pages</span>
          </nav>
        )}
      </main>
    </div>
  )
}

export default function SemuaPage() {
  return <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><span className="dot-pulse"><span>.</span><span>.</span><span>.</span></span></div>}><SemuaContent /></Suspense>
}
