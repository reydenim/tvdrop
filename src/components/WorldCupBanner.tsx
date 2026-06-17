'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ChannelInfo {
  name: string;
  id: string;
}

interface Match {
  slug?: string;
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
  const [selectedCountry, setSelectedCountry] = useState('');

  useEffect(() => {
    // Set default country from available channels
    const countries = Array.from(new Set(matches.flatMap(m => Object.keys(m.channels || {}))));
    if (countries.length > 0 && !selectedCountry) {
      setSelectedCountry(countries[0]);
    }
  }, [matches, selectedCountry]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  // Client-side: filter matches
  const nowStr = now.toISOString().slice(0, 10);
  
  // LIVE + starting_soon = show in HARI INI (regardless of date)
  const liveMatches = matches.filter(m => m.status === 'live');
  const soonMatches = matches.filter(m => m.status === 'starting_soon' && !liveMatches.includes(m));
  const todayMatches = [...liveMatches, ...soonMatches];
  
  // upcoming: future matches NOT already in today, max 12
  const todayIds = new Set(todayMatches.map(m => m.id));
  const upcomingMatches = matches.filter(m => 
    m.date >= nowStr && m.status !== 'finished' && !todayIds.has(m.id)
  ).slice(0, 12);
  
  // finished today: for the score section
  const finishedToday = matches.filter(m => m.date === nowStr && m.status === 'finished');

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
    '🔗 Kora-Plus Streams': 'Kora-Plus',
    '📡 beIN SPORTS': 'beIN Sports',
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
              <Link key={i} href={match.slug ? `/match/${match.slug}` : '#'} style={{ textDecoration: 'none', color: 'inherit' }}>
                <MatchCard match={match} country={selectedCountry} isLive />
              </Link>))}
          </div>
        </div>
      )}

      {/* Today's Matches */}
      {todayMatches.length > 0 && (
        <div className="worldcup-today">
          <h3 className="worldcup-label">📅 JADWAL HARI INI</h3>
          <div className="worldcup-matches-row">
            {todayMatches.map((match, i) => (
              <Link key={i} href={match.slug ? `/match/${match.slug}` : '#'} style={{ textDecoration: 'none', color: 'inherit' }}>
                <MatchCard match={match} country={selectedCountry} />
              </Link>
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
              <Link key={i} href={match.slug ? `/match/${match.slug}` : '#'} style={{ textDecoration: 'none', color: 'inherit' }}>
                <MatchCard match={match} country={selectedCountry} />
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function MatchCard({ match, country, isLive }: { match: Match; country: string; isLive?: boolean }) {
  // Get channels for selected country, fallback to first available group
  const matchGroups = Object.keys(match.channels || {});
  const channels = match.channels[country] || (matchGroups.length > 0 ? match.channels[matchGroups[0]] : []);
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
        {(match as any).score ? (
          <span className="match-score">{(match as any).score}</span>
        ) : (
          <span className="vs">vs</span>
        )}
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
