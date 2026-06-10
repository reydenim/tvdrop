'use client'

import { useEffect, useState } from 'react'

interface CuratedItem {
  id: string; name: string; country: string; logo?: string
}

interface AllChannel {
  id: string; name: string; country: string; logo?: string
}

export default function CuratedPage() {
  const [curated, setCurated] = useState<CuratedItem[]>([])
  const [allChannels, setAllChannels] = useState<AllChannel[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null)
  const [dropTarget, setDropTarget] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/admin/curated')
      .then(r => r.json())
      .then(d => {
        setCurated(d.curated || [])
        setAllChannels(d.allChannels || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const saveOrder = async (items: CuratedItem[]) => {
    const ids = items.map(i => i.id)
    setCurated(items)
    await fetch('/api/admin/curated', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reorder', ids }),
    })
  }

  const addChannel = async (ch: AllChannel) => {
    setCurated(prev => [...prev, { id: ch.id, name: ch.name, country: ch.country, logo: ch.logo }])
    await fetch('/api/admin/curated', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add', channelId: ch.id }),
    })
  }

  const removeChannel = async (id: string) => {
    setCurated(prev => prev.filter(i => i.id !== id))
    await fetch('/api/admin/curated', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'remove', channelId: id }),
    })
  }

  // Drag-and-drop
  const onDragStart = (idx: number) => {
    setDraggedIdx(idx)
  }
  const onDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    setDropTarget(idx)
  }
  const onDrop = (idx: number) => {
    if (draggedIdx === null || draggedIdx === idx) return
    const items = [...curated]
    const [moved] = items.splice(draggedIdx, 1)
    items.splice(idx, 0, moved)
    saveOrder(items)
    setDraggedIdx(null)
    setDropTarget(null)
  }
  const onDragEnd = () => {
    setDraggedIdx(null)
    setDropTarget(null)
  }

  // Channels not in curated
  const curatedIds = new Set(curated.map(i => i.id))
  const available = allChannels.filter(ch => !curatedIds.has(ch.id) && 
    (ch.name.toLowerCase().includes(search.toLowerCase()) || ch.id.toLowerCase().includes(search.toLowerCase()))
  ).slice(0, 50)

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-24 bg-[#1a1a1a] rounded animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-16 bg-[#111] rounded-lg animate-pulse border border-[#222]" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Curated Channels</h1>
        <span className="text-[10px] text-[#555]">{curated.length} channel</span>
      </div>

      <p className="text-[11px] text-[#555]">
        Channel yang tampil di hero carousel homepage. Drag untuk urutkan.
      </p>

      {/* Curated list */}
      {curated.length === 0 ? (
        <div className="text-center text-[#555] py-10 text-sm">Belum ada curated channel</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {curated.map((item, idx) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => onDragStart(idx)}
              onDragOver={e => onDragOver(e, idx)}
              onDrop={() => onDrop(idx)}
              onDragEnd={onDragEnd}
              className={`bg-[#111] border border-[#222] rounded-lg p-3 flex items-center gap-2.5 cursor-grab active:cursor-grabbing transition ${
                dropTarget === idx ? 'border-[#E50914] bg-[#1a1a1a]' : ''
              } ${draggedIdx === idx ? 'opacity-50 scale-95' : ''}`}
            >
              <span className="text-[10px] text-[#555] w-4 shrink-0 text-center">{idx + 1}</span>
              <div className="w-7 h-7 rounded bg-[#1a1a1a] flex items-center justify-center shrink-0 overflow-hidden">
                {item.logo ? (
                  <img src={item.logo} alt="" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-[10px] font-bold text-[#555]">{item.name.charAt(0)}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white truncate">{item.name}</p>
                <p className="text-[9px] text-[#555]">{item.country}</p>
              </div>
              <button onClick={() => removeChannel(item.id)}
                className="text-[#555] hover:text-red-400 transition shrink-0 p-1"
                title="Hapus">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add channel */}
      <div className="bg-[#111] border border-[#222] rounded-lg p-4">
        <h2 className="text-sm font-semibold mb-3">Tambah Channel</h2>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari channel..."
          className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-[#555] mb-3"
        />
        {available.length === 0 ? (
          <p className="text-xs text-[#555] text-center py-4">Channel tidak ditemukan</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto">
            {available.map(ch => (
              <button
                key={ch.id}
                onClick={() => addChannel(ch)}
                className="flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#222] rounded-lg px-3 py-2 text-left transition text-xs"
              >
                <div className="w-5 h-5 rounded bg-[#333] flex items-center justify-center text-[9px] font-bold text-[#555] shrink-0 overflow-hidden">
                  {ch.logo ? <img src={ch.logo} className="w-full h-full object-contain" /> : <span>{ch.name.charAt(0)}</span>}
                </div>
                <div className="min-w-0">
                  <p className="text-white truncate">{ch.name}</p>
                  <p className="text-[9px] text-[#555]">{ch.country}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
