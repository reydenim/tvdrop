'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ChannelInfo {
  name: string;
  id: string;
}

interface Match {
  date: string;
  time_utc: string;
  time_wib: string;
  home: string;
  away: string;
  stage: string;
  venue?: string;
  status: 'live' | 'today' | 'upcoming' | 'starting_soon' | 'finished';
  channels: Record<string, ChannelInfo[]>;
}

interface Props {
  matches: Match[];
}

function parseMatchEnd(match: Match): Date {
  const start = new Date(`${match.date}T${match.time_utc}:00Z`);
  return new Date(start.getTime() + 3 * 60 * 60 * 1000); // +3h (aman buat extra time + penalty)
}

export default function WorldCupBanner({ matches }: Props) {
  const [now, setNow] = useState(new Date());
  const [selectedCountry, setSelectedCountry] = useState('🇮🇩');

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  // Client-side: hide finished matches immediately based on time
  const activeMatches = matches.filter(m => parseMatchEnd(m) > now);
  const liveMatches = activeMatches.filter(m => m.status === 'live');
  const todayMatches = activeMatches.filter(m => m.status === 'today' || m.status === 'starting_soon' || (m.status === 'upcoming' && m.date === now.toISOString().slice(0, 10)));
  const upcomingMatches = activeMatches.filter(m => m.status === 'upcoming' && !todayMatches.includes(m)).slice(0, 10);

  const availableCountries = matches[0]?.channels ? Object.keys(matches[0].channels) : [];
  
  // Country display names
  const countryNames: Record<string, string> = {
    '🇮🇩': 'Indonesia',
    '🇺🇸': 'USA', 
    '🇬🇧': 'UK',
    '🌍': 'MENA',
    '🔴 Live': 'Yacine',
    '🔴 Live Stream': 'Yacine',
    '🔗 Yacine': 'Yacine',
    '🇪🇸': 'Spain',
    '🇩🇪': 'Germany',
    '🇫🇷': 'France',
    '🇳🇱': 'Netherlands',
  };

  if (matches.length === 0) return null;

  return (
    <section className="worldcup-section">
      <div className="worldcup-header">
        <div className="worldcup-title-row">
          <span className="worldcup-trophy">🏆</span>
          <h2>FIFA World Cup 2026</h2>
          {liveMatches.length > 0 && <span className="worldcup-live-badge">{liveMatches.length} LIVE</span>}
        </div>
        <p className="worldcup-subtitle">
          Official broadcasters · Auto-updated schedule
        </p>
        
        {/* Country selector — scrollable */}
        {availableCountries.length > 1 && (
          <div className="worldcup-country-scroll">
            {availableCountries.slice(0, 5).map(flag => (
              <button
                key={flag}
                onClick={() => setSelectedCountry(flag)}
                className={`wc-country-btn ${selectedCountry === flag ? 'active' : ''}`}
              >
                <span className="wc-flag">{flag}</span>
                <span className="wc-name">{countryNames[flag] || flag}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* LIVE Matches */}
      {liveMatches.length > 0 && (
        <div className="worldcup-today wc-live-section">
          <h3 className="worldcup-label live-label">🔴 LIVE SEKARANG</h3>
          <div className="worldcup-matches-row">
            {liveMatches.map((match, i) => (
              <MatchCard key={i} match={match} country={selectedCountry} isLive />
            ))}
          </div>
        </div>
      )}

      {/* Today's Matches */}
      {todayMatches.length > 0 && (
        <div className="worldcup-today">
          <h3 className="worldcup-label">📅 JADWAL HARI INI</h3>
          <div className="worldcup-matches-row">
            {todayMatches.map((match, i) => (
              <MatchCard key={i} match={match} country={selectedCountry} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Matches */}
      {upcomingMatches.length > 0 && (
        <div className="worldcup-upcoming">
          <h3 className="worldcup-label">📋 MENDATANG</h3>
          <div className="worldcup-matches-scroll">
            {upcomingMatches.map((match, i) => (
              <MatchCard key={i} match={match} country={selectedCountry} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function MatchCard({ match, country, isLive }: { match: Match; country: string; isLive?: boolean }) {
  const channels = match.channels[country] || [];
  const timeDisplay = isLive ? '🔴 LIVE' : match.time_wib;

  return (
    <div className={`match-card ${isLive ? 'match-live' : match.status === 'starting_soon' ? 'match-soon' : ''}`}>
      <div className="match-time">
        <span className={`match-datetime ${isLive ? 'text-red' : ''}`}>
          {timeDisplay}
        </span>
        <span className="match-stage">{match.stage}</span>
        {match.venue && <span className="match-venue">{match.venue}</span>}
      </div>
      <div className="match-teams">
        <span className="team home">{match.home}</span>
        <span className="vs">vs</span>
        <span className="team away">{match.away}</span>
      </div>
      
      {channels.length > 0 ? (
        <div className="match-channels-list">
          {channels.map((ch: any, i: number) => (
            ch.is_yacine ? (
              <a
                key={i}
                href={`https://strm01.app/?m=${ch.yacine_match_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="match-channel-link yacine-link"
              >
                <span className="channel-dot live-dot" style={{background:'#f59e0b'}} />
                <span>{ch.name}</span>
                <span className="watch-now">Live →</span>
              </a>
            ) : (
              <Link 
                key={i}
                href={`/watch/${ch.id}`}
                className="match-channel-link"
              >
                <span className="channel-dot live-dot" />
                <span>{ch.name}</span>
                <span className="watch-now">Nonton →</span>
              </Link>
            )
          ))}
        </div>
      ) : (
        <div className="match-channel-hint">
          <span className="channel-dot" style={{background:'#666'}} />
          <span style={{color:'#666'}}>Tidak tersedia</span>
        </div>
      )}
    </div>
  );
}
