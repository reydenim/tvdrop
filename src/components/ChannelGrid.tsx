'use client'

import ChannelCard from './ChannelCard'

interface Channel { id: string; name: string; country: string; quality?: string; url: string; logo?: string }

export default function ChannelGrid({ channels, health }: { channels: Channel[]; health?: Record<string, string> }) {
  if (!channels || channels.length === 0) return <div className="text-center text-white/35 py-24 text-sm">Channel tidak ditemukan</div>
  return <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
    {channels.map(ch => <ChannelCard key={ch.id} ch={ch} health={health?.[ch.id]} />)}
  </div>
}
