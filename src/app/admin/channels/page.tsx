'use client'

import { useEffect, useState, useCallback, useRef } from 'react'

interface Channel {
  id: string; name: string; country: string; quality?: string
  url: string; logo?: string; health: string | null; genres: string[]
}

interface Pagination { page: number; perPage: number; total: number; totalPages: number }
interface Filters { countries: string[]; genres: string[] }

const perPage = 50
const healthBadge: Record<string, { label: string; cls: string }> = {
  live: { label: 'Live', cls: 'bg-green-900/40 text-green-400' },
  dead: { label: 'Dead', cls: 'bg-red-900/40 text-red-400' },
  'geo-blocked': { label: 'Geo', cls: 'bg-yellow-900/40 text-yellow-400' },
  redirect: { label: 'Redirect', cls: 'bg-blue-900/40 text-blue-400' },
  timeout: { label: 'Timeout', cls: 'bg-orange-900/40 text-orange-400' },
}

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [filters, setFilters] = useState<Filters | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [countryFilter, setCountryFilter] = useState('')
  const [genreFilter, setGenreFilter] = useState('')
  const [healthFilter, setHealthFilter] = useState('')
  const [sort, setSort] = useState('name')
  const [order, setOrder] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)

  // Edit modal
  const [editCh, setEditCh] = useState<Channel | null>(null)
  const [editForm, setEditForm] = useState({ name: '', country: '', quality: '', url: '' })

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteName, setDeleteName] = useState('')

  const searchRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const fetchChannels = useCallback(async (p: number, q: string, c: string, g: string, h: string, s: string, o: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(p), perPage: String(perPage), sort: s, order: o,
        ...(q && { q }), ...(c && { country: c }), ...(g && { genre: g }), ...(h && { health: h }),
      })
      const res = await fetch(`/api/admin/channels?${params}`)
      const data = await res.json()
      setChannels(data.channels)
      setPagination(data.pagination)
      if (data.filters) setFilters(data.filters)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchChannels(page, search, countryFilter, genreFilter, healthFilter, sort, order)
  }, [page, sort, order, countryFilter, genreFilter, healthFilter])

  const onSearch = (v: string) => {
    setSearch(v)
    clearTimeout(searchRef.current)
    searchRef.current = setTimeout(() => {
      setPage(1)
      fetchChannels(1, v, countryFilter, genreFilter, healthFilter, sort, order)
    }, 300)
  }

  const toggleSort = (field: string) => {
    if (sort === field) setOrder(o => o === 'asc' ? 'desc' : 'asc')
    else { setSort(field); setOrder('asc') }
    setPage(1)
  }

  const sortIcon = (field: string) => {
    if (sort !== field) return ' \u2195'
    return order === 'asc' ? ' \u2191' : ' \u2193'
  }

  // Edit handlers
  const openEdit = (ch: Channel) => {
    setEditCh(ch)
    setEditForm({ name: ch.name, country: ch.country, quality: ch.quality || '', url: ch.url })
  }

  const saveEdit = async () => {
    if (!editCh) return
    await fetch(`/api/admin/channels/${encodeURIComponent(editCh.id)}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    setEditCh(null)
    fetchChannels(page, search, countryFilter, genreFilter, healthFilter, sort, order)
  }

  const confirmDelete = (ch: Channel) => {
    setDeleteId(ch.id)
    setDeleteName(ch.name)
  }

  const doDelete = async () => {
    if (!deleteId) return
    await fetch(`/api/admin/channels/${encodeURIComponent(deleteId)}`, { method: 'DELETE' })
    setDeleteId(null)
    setDeleteName('')
    fetchChannels(page, search, countryFilter, genreFilter, healthFilter, sort, order)
  }

  // Pagination helpers
  const pages: number[] = []
  if (pagination) {
    const total = pagination.totalPages
    const start = Math.max(1, page - 2)
    const end = Math.min(total, page + 2)
    for (let i = start; i <= end; i++) pages.push(i)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">Channels</h1>

      {/* Search + Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder="Cari channel..."
          className="bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-[#555] w-48"
        />
        <select value={countryFilter} onChange={e => { setCountryFilter(e.target.value); setPage(1) }}
          className="bg-[#1a1a1a] border border-[#333] rounded-lg px-2 py-1.5 text-xs text-[#aaa] outline-none cursor-pointer">
          <option value="">Semua Negara</option>
          {filters?.countries.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={genreFilter} onChange={e => { setGenreFilter(e.target.value); setPage(1) }}
          className="bg-[#1a1a1a] border border-[#333] rounded-lg px-2 py-1.5 text-xs text-[#aaa] outline-none cursor-pointer">
          <option value="">Semua Genre</option>
          {filters?.genres.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <select value={healthFilter} onChange={e => { setHealthFilter(e.target.value); setPage(1) }}
          className="bg-[#1a1a1a] border border-[#333] rounded-lg px-2 py-1.5 text-xs text-[#aaa] outline-none cursor-pointer">
          <option value="">Semua Status</option>
          <option value="live">Live</option>
          <option value="dead">Dead</option>
          <option value="geo-blocked">Geo-blocked</option>
          <option value="timeout">Timeout</option>
        </select>
        {pagination && (
          <span className="text-[10px] text-[#555] ml-auto">
            {pagination.total.toLocaleString()} channel
          </span>
        )}
      </div>

      {/* Table */}
      <div className="bg-[#111] border border-[#222] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#222] bg-[#0a0a0a]">
                <th className="text-left px-3 py-2 text-[#666] font-medium cursor-pointer select-none" onClick={() => toggleSort('name')}>
                  Name{sortIcon('name')}
                </th>
                <th className="text-left px-3 py-2 text-[#666] font-medium cursor-pointer select-none" onClick={() => toggleSort('country')}>
                  Negara{sortIcon('country')}
                </th>
                <th className="text-left px-3 py-2 text-[#666] font-medium cursor-pointer select-none" onClick={() => toggleSort('quality')}>
                  Quality{sortIcon('quality')}
                </th>
                <th className="text-left px-3 py-2 text-[#666] font-medium">Status</th>
                <th className="text-left px-3 py-2 text-[#666] font-medium">Genre</th>
                <th className="text-right px-3 py-2 text-[#666] font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i} className="border-b border-[#1a1a1a]">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-3 py-3"><div className="h-3 bg-[#1a1a1a] rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : channels.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-[#555] py-10">Channel tidak ditemukan</td></tr>
              ) : (
                channels.map(ch => {
                  const hb = healthBadge[ch.health || ''] || { label: ch.health || '-', cls: 'text-[#555]' }
                  return (
                    <tr key={ch.id} className="border-b border-[#1a1a1a] hover:bg-[#0a0a0a] transition">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          {ch.logo ? (
                            <img src={ch.logo} alt="" className="w-5 h-5 rounded object-contain bg-[#1a1a1a]" />
                          ) : (
                            <div className="w-5 h-5 rounded bg-[#333] flex items-center justify-center text-[9px] font-bold text-[#555]">
                              {ch.name.charAt(0)}
                            </div>
                          )}
                          <span className="text-white truncate max-w-[200px]" title={ch.name}>{ch.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-[#888]">{ch.country}</td>
                      <td className="px-3 py-2.5 text-[#666]">{ch.quality || '-'}</td>
                      <td className="px-3 py-2.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${hb.cls}`}>{hb.label}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1 flex-wrap">
                          {ch.genres.slice(0, 2).map(g => (
                            <span key={g} className="text-[9px] text-[#555] bg-[#1a1a1a] px-1 py-0.5 rounded">{g}</span>
                          ))}
                          {ch.genres.length > 2 && <span className="text-[9px] text-[#555]">+{ch.genres.length - 2}</span>}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(ch)}
                            className="text-[10px] px-2 py-1 rounded bg-[#1a1a1a] text-[#888] hover:text-white hover:bg-[#2a2a2a] transition">
                            Edit
                          </button>
                          <button onClick={() => confirmDelete(ch)}
                            className="text-[10px] px-2 py-1 rounded bg-red-900/20 text-red-400 hover:bg-red-900/40 transition">
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-1">
          <button disabled={page <= 1} onClick={() => setPage(1)}
            className="text-xs px-2 py-1 rounded bg-[#1a1a1a] text-[#666] hover:text-white disabled:opacity-30 transition">
            &laquo;
          </button>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="text-xs px-2 py-1 rounded bg-[#1a1a1a] text-[#666] hover:text-white disabled:opacity-30 transition">
            &lsaquo;
          </button>
          {pages.map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`text-xs px-2.5 py-1 rounded transition ${p === page ? 'bg-white text-black font-semibold' : 'bg-[#1a1a1a] text-[#666] hover:text-white'}`}>
              {p}
            </button>
          ))}
          <button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}
            className="text-xs px-2 py-1 rounded bg-[#1a1a1a] text-[#666] hover:text-white disabled:opacity-30 transition">
            &rsaquo;
          </button>
          <button disabled={page >= pagination.totalPages} onClick={() => setPage(pagination.totalPages)}
            className="text-xs px-2 py-1 rounded bg-[#1a1a1a] text-[#666] hover:text-white disabled:opacity-30 transition">
            &raquo;
          </button>
          <span className="text-[10px] text-[#555] ml-2">
            {page} / {pagination.totalPages}
          </span>
        </div>
      )}

      {/* Edit Modal */}
      {editCh && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setEditCh(null)}>
          <div className="bg-[#111] border border-[#333] rounded-xl p-5 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold mb-4">Edit Channel</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-[#555] block mb-1">Name</label>
                <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-[#555]" />
              </div>
              <div>
                <label className="text-[10px] text-[#555] block mb-1">Country</label>
                <input value={editForm.country} onChange={e => setEditForm(f => ({ ...f, country: e.target.value }))}
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-[#555]" />
              </div>
              <div>
                <label className="text-[10px] text-[#555] block mb-1">Quality</label>
                <input value={editForm.quality} onChange={e => setEditForm(f => ({ ...f, quality: e.target.value }))}
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-[#555]" />
              </div>
              <div>
                <label className="text-[10px] text-[#555] block mb-1">URL</label>
                <input value={editForm.url} onChange={e => setEditForm(f => ({ ...f, url: e.target.value }))}
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-[#555] font-mono" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-5 justify-end">
              <button onClick={() => setEditCh(null)}
                className="text-xs px-4 py-1.5 rounded-full bg-[#1a1a1a] text-[#888] hover:text-white transition">
                Batal
              </button>
              <button onClick={saveEdit}
                className="text-xs px-4 py-1.5 rounded-full bg-white text-black font-semibold hover:bg-gray-200 transition">
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setDeleteId(null)}>
          <div className="bg-[#111] border border-[#333] rounded-xl p-5 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold mb-2">Hapus Channel</h3>
            <p className="text-xs text-[#888] mb-1">Yakin mau hapus channel ini?</p>
            <p className="text-sm text-white font-medium mb-4">{deleteName}</p>
            <p className="text-[10px] text-red-400/70 mb-4">Data channel & curated akan terhapus permanen.</p>
            <div className="flex items-center gap-2 justify-end">
              <button onClick={() => setDeleteId(null)}
                className="text-xs px-4 py-1.5 rounded-full bg-[#1a1a1a] text-[#888] hover:text-white transition">
                Batal
              </button>
              <button onClick={doDelete}
                className="text-xs px-4 py-1.5 rounded-full bg-red-600 text-white font-semibold hover:bg-red-500 transition">
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
