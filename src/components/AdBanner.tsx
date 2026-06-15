'use client'

interface AdBannerProps { slot: string; format?: 'banner' | 'leaderboard' | 'skyscraper' | 'rectangle'; className?: string; link?: string }
const sizes: Record<string, string> = { banner: 'h-[72px] md:h-[92px]', leaderboard: 'h-[96px] md:h-[180px]', rectangle: 'h-[250px]', skyscraper: 'h-[600px]' }

export default function AdBanner({ slot, format = 'banner', className = '', link }: AdBannerProps) {
  const height = sizes[format] || sizes.banner
  const isLeader = format === 'leaderboard'

  if (link) {
    return (
      <div className={`relative ${height} ${className}`}>
        <a href={link} target="_blank" rel="nofollow sponsored noopener" className="group relative flex items-center w-full h-full rounded-2xl overflow-hidden transition duration-500 hover:scale-[1.006] tv-glass">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_50%,rgba(229,9,20,.22),transparent_32%),linear-gradient(135deg,rgba(255,255,255,.08),rgba(255,255,255,.025))]" />
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(90deg,#fff 1px,transparent 1px),linear-gradient(#fff 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
          <div className="absolute top-3 right-3 z-20 hidden sm:block">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.08] border border-white/10 text-[10px] font-semibold text-white/45 uppercase tracking-[0.18em]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E50914] animate-pulse" /> Sponsored
            </span>
          </div>
          <div className="relative z-10 flex items-center w-full h-full px-4 md:px-7 gap-4 md:gap-5">
            <div className="flex-shrink-0 w-11 h-11 md:w-14 md:h-14 rounded-2xl bg-white/[0.08] border border-white/10 flex items-center justify-center group-hover:bg-[#E50914]/20 group-hover:border-[#E50914]/40 transition duration-500">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="w-5 h-5 md:w-6 md:h-6 text-white/70"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-black tv-title text-base md:text-xl leading-tight">{isLeader ? 'Premium access, no waiting' : 'Unlock free access'}</p>
              <p className="text-[11px] md:text-xs text-white/38 mt-1">Fast offer · opens in new tab</p>
            </div>
            <span className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 rounded-full bg-white text-black text-xs md:text-sm font-bold group-hover:bg-[#E50914] group-hover:text-white transition duration-500">
              Try Free
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </span>
          </div>
        </a>
      </div>
    )
  }

  return <div id={`ad-${slot}`} className={`relative flex items-center justify-center overflow-hidden ${height} ${className}`}><div className="flex items-center justify-center w-full h-full tv-glass rounded-2xl"><span className="text-[10px] text-white/20 uppercase tracking-widest select-none">AD · {slot}</span></div></div>
}
