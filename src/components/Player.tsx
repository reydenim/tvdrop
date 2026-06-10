'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Hls from 'hls.js'
import { MediaPlayer as DashPlayer } from 'dashjs'

interface Channel {
  id: string
  name: string
  country: string
  url: string
}

// SVG Icons
const PlayIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M8 5v14l11-7z"/></svg>
const PauseIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>
const VolHighIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 8.5v7a4.5 4.5 0 002.5-3.5zM14 3.23v2.06a6.5 6.5 0 010 13.42v2.06A8.5 8.5 0 0014 3.23z"/></svg>
const VolLowIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 8.5v7a4.5 4.5 0 002.5-3.5z"/></svg>
const VolMuteIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 8.5v7a4.5 4.5 0 002.5-3.5zM16.5 6.5l-5 5m5 0l-5-5"/><line x1="16.5" y1="6.5" x2="21.5" y2="11.5" stroke="currentColor" strokeWidth="2"/><line x1="21.5" y1="6.5" x2="16.5" y2="11.5" stroke="currentColor" strokeWidth="2"/></svg>
const PiPIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><rect x="2" y="3" width="20" height="14" rx="2"/><rect x="12" y="9" width="8" height="6" rx="1" fill="currentColor" stroke="none"/></svg>
const FullscreenIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>

export default function Player({ ch, onClose }: { ch: Channel; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const hideTimer = useRef<NodeJS.Timeout | undefined>(undefined)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [levels, setLevels] = useState<{ idx: number; label: string }[]>([])
  const [currentLevel, setCurrentLevel] = useState(-1)
  const [showQual, setShowQual] = useState(false)
  const [showCtrls, setShowCtrls] = useState(true)
  const [status, setStatus] = useState('Loading')
  const [buffering, setBuffering] = useState(false)
  const [isFs, setIsFs] = useState(false)

  const fmt = (t: number) => {
    const m = Math.floor(t / 60)
    const s = Math.floor(t % 60)
    return m + ':' + (s < 10 ? '0' : '') + s
  }

  const showControls = useCallback(() => {
    setShowCtrls(true)
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setShowCtrls(false), 1000)
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let dashInstance: any = null

    if (ch.url.includes('.mpd')) {
      // DASH stream
      const dash = DashPlayer().create()
      dashInstance = dash
      dash.initialize(video, ch.url, true)
      video.play().catch(() => {})
      setStatus('Live')
    } else if (Hls.isSupported() && ch.url.includes('.m3u8')) {
      const hls = new Hls()
      hlsRef.current = hls
      hls.loadSource(ch.url)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {})
        setStatus('Live')
        if (hls.levels && hls.levels.length >= 1) {
          setLevels(hls.levels.map((l, i) => ({
            idx: i,
            label: (l.height ? l.height + 'p' : 'Lv' + i) + (l.bitrate ? ' (' + Math.round(l.bitrate / 1000) + 'k)' : '')
          })))
        }
      })
      hls.on(Hls.Events.ERROR, (_e, d) => {
        if (d.fatal) setStatus('Error')
      })
    } else {
      video.src = ch.url
      video.play().catch(() => {})
      setStatus('Live')
    }

    return () => {
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null }
      if (dashInstance) { dashInstance.reset(); dashInstance = null }
      video.pause()
      video.src = ''
    }
  }, [ch.url])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const onTime = () => { setCurrentTime(video.currentTime); setDuration(video.duration || 0) }
    const onPlay = () => { setPlaying(true); showControls(); setBuffering(false) }
    const onPause = () => { setPlaying(false); setShowCtrls(true); clearTimeout(hideTimer.current) }
    const onWaiting = () => { setBuffering(true) }
    const onPlaying = () => { setBuffering(false) }
    video.addEventListener('timeupdate', onTime)
    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('waiting', onWaiting)
    video.addEventListener('playing', onPlaying)
    return () => {
      video.removeEventListener('timeupdate', onTime)
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('waiting', onWaiting)
      video.removeEventListener('playing', onPlaying)
    }
  }, [showControls])

  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play() } else { v.pause() }
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current
    if (!v || !v.duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    v.currentTime = ((e.clientX - rect.left) / rect.width) * v.duration
  }

  const toggleMute = () => {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
  }

  const changeVol = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current
    if (!v) return
    const rect = e.currentTarget.getBoundingClientRect()
    const vol = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    v.volume = vol
    v.muted = false
    setVolume(vol)
    setMuted(false)
  }

  const setQual = (idx: number) => {
    if (!hlsRef.current) return
    hlsRef.current.currentLevel = idx
    setCurrentLevel(idx)
    setShowQual(false)
  }

  const pip = async () => {
    const v = videoRef.current
    if (!v) return
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture()
      else await v.requestPictureInPicture()
    } catch {}
  }

  const fs = async () => {
    const el = document.getElementById('plyr')
    if (!el) return
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
        setIsFs(false)
        try { (screen as any).orientation?.unlock?.() } catch {}
      } else {
        await el.requestFullscreen()
        setIsFs(true)
        // Lock to landscape on mobile
        try { await (screen as any).orientation?.lock?.('landscape') } catch {}
      }
    } catch {}
  }

  // Listen for fullscreen exit via ESC
  useEffect(() => {
    const onFsChange = () => { if (!document.fullscreenElement) setIsFs(false) }
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const v = videoRef.current
      if (!v) return
      switch (e.key) {
        case ' ': e.preventDefault(); v.paused ? v.play() : v.pause(); break
        case 'f': case 'F': fs(); break
        case 'm': case 'M': v.muted = !v.muted; setMuted(v.muted); break
        case 'ArrowLeft': v.currentTime = Math.max(0, v.currentTime - 10); break
        case 'ArrowRight': v.currentTime = Math.min(v.duration || 0, v.currentTime + 10); break
        case 'ArrowUp': v.volume = Math.min(1, v.volume + 0.1); setVolume(v.volume); setMuted(false); break
        case 'ArrowDown': v.volume = Math.max(0, v.volume - 0.1); setVolume(v.volume); break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const VolIcon = muted || volume === 0 ? VolMuteIcon : volume < 0.5 ? VolLowIcon : VolHighIcon

  return (
    <div
      id="plyr"
      className={`relative bg-black overflow-hidden ${isFs ? 'h-screen max-h-full' : 'max-h-[60vh]'}`}
      onMouseMove={showControls}
      onTouchStart={showControls}
    >
      <video ref={videoRef} className={`w-full block cursor-pointer ${isFs ? 'h-full' : 'max-h-[60vh]'}`} />

      {/* Top info */}
      <div className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-3 flex items-center gap-2 transition-opacity duration-300 z-10 ${showCtrls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div>
          <span className="text-sm font-semibold text-white">{ch.name}</span>
          <span className="text-[10px] text-gray-400 ml-2">{ch.country}</span>
          <span className={`text-[10px] ml-2 ${status === 'Error' ? 'text-red-400' : 'text-green-400'}`}>
            {status === 'Error' ? '\u2716 Error' : '\u25CF ' + status}
          </span>
        </div>
      </div>

      {/* Big play */}
      {!playing && (
        <button onClick={togglePlay} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-black/60 border-2 border-white/30 text-white flex items-center justify-center hover:bg-white/20 hover:border-white/60 transition-all z-10 pl-1">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7"><path d="M8 5v14l11-7z"/></svg>
        </button>
      )}

      {/* Buffering spinner */}
      {buffering && playing && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <svg className="animate-spin h-10 w-10 text-white/70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}

      {/* Bottom controls */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 to-transparent px-3 pt-8 pb-2 flex items-center gap-2 transition-opacity duration-300 z-10 ${showCtrls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <button onClick={togglePlay} className="text-white bg-transparent border-0 cursor-pointer opacity-85 hover:opacity-100 flex-shrink-0 w-8 h-8 flex items-center justify-center">
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>

        {/* Seek */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <div className="flex-1 h-1 rounded bg-white/20 cursor-pointer relative hover:h-1.5 transition-all" onClick={seek}>
            <div className="h-full rounded bg-white" style={{ width: duration ? (currentTime / duration * 100) + '%' : '0%' }} />
          </div>
          <span className="text-[10px] text-gray-400 tabular-nums whitespace-nowrap">{fmt(currentTime)} / {fmt(duration)}</span>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-2 group">
          <button onClick={toggleMute} className="text-white bg-transparent border-0 cursor-pointer opacity-85 hover:opacity-100 w-8 h-8 flex items-center justify-center flex-shrink-0" title={muted ? 'Unmute' : 'Mute'}>
            <VolIcon />
          </button>
          <div className="w-16 h-8 flex items-center cursor-pointer" onClick={changeVol}>
            <div className="w-full h-1.5 rounded-full bg-white/20 relative hover:h-2 transition-all">
              <div className="h-full rounded-full bg-white relative flex items-center" style={{ width: (muted ? 0 : volume * 100) + '%' }}>
                <div className="absolute right-0 w-3.5 h-3.5 rounded-full bg-white shadow -mr-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>
        </div>

        {/* Quality */}
        <div className="relative">
          <button onClick={() => setShowQual(!showQual)} className="text-[11px] text-gray-300 bg-white/10 border-0 rounded px-1.5 py-0.5 cursor-pointer hover:bg-white/20 h-6 min-w-[40px]">
            {currentLevel === -1 ? 'Auto' : levels.find(l => l.idx === currentLevel)?.label || 'Auto'}
          </button>
          {showQual && levels.length > 0 && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowQual(false)} />
                <div className="absolute bottom-full right-0 mb-2 bg-[#1a1a1a] border border-[#333] rounded-lg p-1 z-40 min-w-[100px] max-h-48 overflow-y-auto">
                  <div className={`px-2.5 py-1.5 text-xs rounded cursor-pointer ${currentLevel === -1 ? 'bg-white text-black font-semibold' : 'text-gray-400 hover:bg-[#2a2a2a]'}`} onClick={() => setQual(-1)}>Auto</div>
                  {levels.map(l => (
                    <div key={l.idx} className={`px-2.5 py-1.5 text-xs rounded cursor-pointer ${currentLevel === l.idx ? 'bg-white text-black font-semibold' : 'text-gray-400 hover:bg-[#2a2a2a]'}`} onClick={() => setQual(l.idx)}>
                      {l.label}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

        {/* PiP */}
        <button onClick={pip} className="text-white bg-transparent border-0 cursor-pointer opacity-85 hover:opacity-100 w-7 h-7 flex items-center justify-center flex-shrink-0" title="PiP"><PiPIcon /></button>
        {/* Fullscreen */}
        <button onClick={fs} className="text-white bg-transparent border-0 cursor-pointer opacity-85 hover:opacity-100 w-7 h-7 flex items-center justify-center flex-shrink-0" title="Fullscreen"><FullscreenIcon /></button>
      </div>
    </div>
  )
}
