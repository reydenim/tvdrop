'use client'

import { useEffect, useState } from 'react'

interface TrafficData {
  updated_at: string
  total_requests: number
  today_requests: number
  today_unique: number
  bandwidth_mb: number
  recent_5000: { unique_visitors: number; total_hits: number; bandwidth_mb: number }
  top_pages: [string, number][]
  top_referrers: [string, number][]
  status_codes: Record<string, number>
  hourly: Record<string, number>
}

export default function MonitorPage() {
  const [data, setData] = useState<TrafficData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/traffic')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-32 bg-[#1a1a1a] rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-[#111] rounded-lg animate-pulse border border-[#222]" />)}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <p className="text-[#555] text-sm">Belum ada data traffic</p>
        <p className="text-[10px] text-[#555] mt-2">Data akan muncul dalam 5 menit setelah cron berjalan.</p>
      </div>
    )
  }

  const maxHourly = Math.max(...Object.values(data.hourly), 1)
  const statusTotal = Object.values(data.status_codes).reduce((a, b) => a + b, 0)

  const Card = ({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) => (
    <div className="bg-[#111] border border-[#222] rounded-lg p-4">
      <p className="text-[10px] text-[#555] uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-xl font-bold ${color || 'text-white'}`}>{typeof value === 'number' ? value.toLocaleString() : value}</p>
      {sub && <p className="text-[10px] text-[#555] mt-0.5">{sub}</p>}
    </div>
  )

  const statusColors: Record<string, string> = {
    '200': 'text-green-400', '206': 'text-green-400',
    '301': 'text-blue-400', '302': 'text-blue-400', '307': 'text-blue-400',
    '304': 'text-[#555]',
    '400': 'text-yellow-400', '401': 'text-yellow-400', '403': 'text-yellow-400', '404': 'text-yellow-400',
    '500': 'text-red-400', '502': 'text-red-400', '503': 'text-red-400',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Visitor Monitor</h1>
        <span className="text-[10px] text-[#555]">
          Updated {new Date(data.updated_at).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' })}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card label="Total Requests" value={data.total_requests} sub={`${data.today_requests.toLocaleString()} hari ini`} />
        <Card label="Unique Hari Ini" value={data.today_unique} color="text-green-400" />
        <Card label="Bandwidth" value={`${data.bandwidth_mb} MB`} sub="(recent 5000)" />
        <Card label="Unique (Recent)" value={data.recent_5000.unique_visitors} sub={`${data.recent_5000.total_hits} hits`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly chart */}
        <div className="bg-[#111] border border-[#222] rounded-lg p-4">
          <h2 className="text-xs font-semibold text-[#888] mb-3">Traffic per Jam (recent 5000)</h2>
          <div className="flex items-end gap-1 h-32">
            {Object.entries(data.hourly).map(([hour, count]) => (
              <div key={hour} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="w-full bg-[#1a1a1a] rounded-t relative overflow-hidden" style={{ height: `${(count / maxHourly) * 100}%` }}>
                  <div className="absolute inset-0 bg-[#E50914] opacity-80 group-hover:opacity-100 transition-opacity" style={{ height: '100%' }} />
                </div>
                <span className="text-[8px] text-[#555]">{hour}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status codes */}
        <div className="bg-[#111] border border-[#222] rounded-lg p-4">
          <h2 className="text-xs font-semibold text-[#888] mb-3">Status Codes</h2>
          <div className="space-y-2">
            {Object.entries(data.status_codes).sort((a, b) => b[1] - a[1]).map(([code, count]) => (
              <div key={code} className="flex items-center gap-3">
                <span className={`text-xs font-mono w-10 ${statusColors[code] || 'text-[#888]'}`}>{code}</span>
                <div className="flex-1 h-3 bg-[#1a1a1a] rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-current opacity-60" style={{ width: `${(count / statusTotal) * 100}%` }} />
                </div>
                <span className="text-xs text-[#555] w-16 text-right">{count.toLocaleString()}</span>
                <span className="text-[10px] text-[#444] w-10 text-right">{Math.round(count / statusTotal * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top pages */}
      <div className="bg-[#111] border border-[#222] rounded-lg p-4">
        <h2 className="text-xs font-semibold text-[#888] mb-3">Top Pages</h2>
        <div className="space-y-1">
          {data.top_pages.slice(0, 15).map(([page, count], i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="text-[10px] text-[#555] w-5 text-right">{i + 1}.</span>
              <span className="text-[#aaa] truncate flex-1 font-mono text-[11px]">{page}</span>
              <span className="text-[#555] w-16 text-right">{count.toLocaleString()}</span>
              <div className="w-20 h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                <div className="h-full bg-[#E50914]/60 rounded-full" style={{ width: `${(count / data.top_pages[0][1]) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top referrers */}
      {data.top_referrers.length > 0 && (
        <div className="bg-[#111] border border-[#222] rounded-lg p-4">
          <h2 className="text-xs font-semibold text-[#888] mb-3">Top Referrers</h2>
          <div className="space-y-1">
            {data.top_referrers.map(([ref, count], i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="text-[10px] text-[#555] w-5 text-right">{i + 1}.</span>
                <span className="text-[#aaa] truncate flex-1">{ref}</span>
                <span className="text-[#555]">{count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
