import { notFound } from 'next/navigation'
import Link from 'next/link'
import rawData from '@/data/channels.json'
import fs from 'fs'
import path from 'path'

interface MatchData {
  id: string
  slug: string
  date: string
  time_utc: string
  time_wib: string
  home: string
  away: string
  home_abbr: string
  away_abbr: string
  home_score: number | null
  away_score: number | null
  group: string
  stage: string
  status: string
  venue?: string
  channels: Record<string, { name: string; id: string }[]>
}

function loadMatch(slug: string): MatchData | null {
  try {
    const p = path.join(process.cwd(), 'src/data/worldcup_schedule.json')
    if (!fs.existsSync(p)) return null
    const raw = JSON.parse(fs.readFileSync(p, 'utf-8'))
    const matches: MatchData[] = Array.isArray(raw) ? raw : (raw.matches || [])
    return matches.find(m => m.slug === slug) || null
  } catch { return null }
}

function getChannelById(id: string) {
  const ch = rawData.channels.find((c: any) => c.id === id)
  return ch || null
}

export default async function MatchPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const match = loadMatch(slug)
  if (!match) notFound()

  const statusLabel: Record<string, string> = {
    live: '🔴 LIVE',
    upcoming: '📅 Mendatang',
    starting_soon: '⚡ Segera',
    finished: '✅ Selesai',
  }

  const statusColor: Record<string, string> = {
    live: '#E50914',
    upcoming: '#f0a500',
    starting_soon: '#f59e0b',
    finished: '#666',
  }

  const score = match.home_score !== null ? `${match.home_score} - ${match.away_score}` : 'vs'

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#e6edf3', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #1a1a1a', background: '#0f0f0f' }}>
        <Link href="/" style={{ color: '#E50914', fontWeight: 900, fontSize: 20, textDecoration: 'none', marginRight: 16 }}>TVDROP</Link>
        <span style={{ color: '#666', fontSize: 13 }}>›</span>
        <Link href="/" style={{ color: '#999', fontSize: 13, textDecoration: 'none', marginLeft: 8 }}>World Cup 2026</Link>
        <span style={{ color: '#666', fontSize: 13, marginLeft: 8 }}>›</span>
        <span style={{ color: '#e6edf3', fontSize: 13, marginLeft: 8, fontWeight: 600 }}>{match.home} vs {match.away}</span>
      </header>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
        {/* Hero Match Card */}
        <div style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%)',
          border: '1px solid #222',
          borderRadius: 16,
          padding: '32px 24px',
          marginBottom: 32,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 12, color: '#666', letterSpacing: 2, marginBottom: 8, textTransform: 'uppercase' }}>
            FIFA World Cup 2026 · {match.stage}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'clamp(16px, 5vw, 48px)', margin: '24px 0' }}>
            {/* Home Team */}
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ width: 80, height: 80, margin: '0 auto 12px', borderRadius: '50%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, color: '#fff' }}>
                {match.home_abbr}
              </div>
              <h2 style={{ fontSize: 'clamp(16px, 4vw, 24px)', fontWeight: 800, margin: 0, color: '#fff' }}>{match.home}</h2>
            </div>

            {/* Score / VS */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: match.home_score !== null ? 'clamp(32px, 8vw, 56px)' : 'clamp(20px, 4vw, 32px)',
                fontWeight: 900,
                color: match.home_score !== null ? '#fff' : '#E50914',
                marginBottom: 4,
              }}>
                {score}
              </div>
              <div style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: 20,
                background: statusColor[match.status] + '22',
                color: statusColor[match.status],
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 1,
                border: `1px solid ${statusColor[match.status]}44`,
              }}>
                {statusLabel[match.status] || match.status}
              </div>
            </div>

            {/* Away Team */}
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ width: 80, height: 80, margin: '0 auto 12px', borderRadius: '50%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, color: '#fff' }}>
                {match.away_abbr}
              </div>
              <h2 style={{ fontSize: 'clamp(16px, 4vw, 24px)', fontWeight: 800, margin: 0, color: '#fff' }}>{match.away}</h2>
            </div>
          </div>

          {/* Match Info */}
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', fontSize: 13, color: '#888' }}>
            <span>📅 {match.date}</span>
            <span>🕐 {match.time_wib} WIB</span>
            {match.venue && <span>📍 {match.venue}</span>}
          </div>
        </div>

        {/* Share button */}
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <button id="shareBtn" style={{
            background: '#1a1a1a',
            border: '1px solid #333',
            color: '#999',
            padding: '10px 24px',
            borderRadius: 20,
            fontSize: 13,
            cursor: 'pointer',
            fontWeight: 600,
          }}
          onClick={(e: any) => {
            const url = window.location.href
            navigator.clipboard?.writeText(url).then(() => {
              e.target.textContent = '✅ Link copied!'
              setTimeout(() => { e.target.textContent = '🔗 Copy Share Link' }, 2000)
            })
          }}>
            🔗 Copy Share Link
          </button>
        </div>

        {/* Channels */}
        {match.channels && Object.keys(match.channels).length > 0 ? (
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20, color: '#fff' }}>
              📺 Live Stream Channels ({Object.values(match.channels).flat().length} total)
            </h3>
            {Object.entries(match.channels).map(([region, chs]) => (
              <div key={region} style={{ marginBottom: 24 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: '#aaa', marginBottom: 10, letterSpacing: 1 }}>
                  {region}
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
                  {chs.map((ch: any) => {
                    const channel = getChannelById(ch.id)
                    return (
                      <Link
                        key={ch.id}
                        href={`/watch/${encodeURIComponent(ch.id)}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '12px 16px',
                          background: '#111',
                          border: '1px solid #222',
                          borderRadius: 12,
                          textDecoration: 'none',
                          color: '#e6edf3',
                          transition: 'all .2s',
                        }}
                        onMouseEnter={(e: any) => { e.currentTarget.style.borderColor = '#E50914' }}
                        onMouseLeave={(e: any) => { e.currentTarget.style.borderColor = '#222' }}
                      >
                        {channel?.logo ? (
                          <img src={channel.logo} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'contain', background: '#1a1a1a' }} />
                        ) : (
                          <div style={{ width: 36, height: 36, borderRadius: 6, background: '#E50914', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                            📺
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ch.name}</div>
                          {channel && <div style={{ fontSize: 11, color: '#666' }}>{channel.country} · {channel.quality || 'HD'}</div>}
                        </div>
                        <span style={{ color: '#E50914', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>Nonton →</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
            <p style={{ fontSize: 16 }}>📡 Stream links will appear when the match goes live.</p>
            <p style={{ fontSize: 13, marginTop: 8 }}>Check back at {match.time_wib} WIB on {match.date}</p>
          </div>
        )}
      </main>
    </div>
  )
}
