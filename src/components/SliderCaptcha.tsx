'use client'

import { useRef, useState, useEffect } from 'react'

export default function SliderCaptcha({ onDone }: { onDone: () => void }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [done, setDone] = useState(false)

  const handleMove = (clientX: number) => {
    if (!trackRef.current || done) return
    const rect = trackRef.current.getBoundingClientRect()
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
    setPos(pct)
    if (pct >= 95) {
      setDone(true)
      setDragging(false)
      setTimeout(onDone, 300)
    }
  }

  // Mouse
  const onMouseDown = () => { if (!done) setDragging(true) }
  useEffect(() => {
    if (!dragging) return
    const onMove = (e: MouseEvent) => handleMove(e.clientX)
    const onUp = () => setDragging(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [dragging, done])

  // Touch
  const onTouchStart = () => { if (!done) setDragging(true) }
  useEffect(() => {
    if (!dragging) return
    const onMove = (e: TouchEvent) => handleMove(e.touches[0].clientX)
    const onEnd = () => setDragging(false)
    window.addEventListener('touchmove', onMove)
    window.addEventListener('touchend', onEnd)
    return () => { window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onEnd) }
  }, [dragging, done])

  return (
    <div className="w-full flex flex-col items-center justify-center py-12 px-4">
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] flex items-center justify-center mx-auto mb-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.5" className="w-8 h-8">
            <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" />
            <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" />
          </svg>
        </div>
        <p className="text-sm text-[#888]">Geser untuk menonton</p>
      </div>

      <div
        ref={trackRef}
        className="relative w-full max-w-xs h-12 bg-[#1a1a1a] rounded-full border border-[#333] overflow-hidden select-none"
      >
        {/* Fill */}
        <div
          className="absolute left-0 top-0 h-full bg-[#E50914]/30 rounded-full transition-[width] duration-75"
          style={{ width: pos + '%' }}
        />
        {/* Text */}
        {!done && pos < 30 && (
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[11px] text-[#555] whitespace-nowrap select-none">
            Geser ke kanan &rarr;
          </span>
        )}
        {/* Slider */}
        <div
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          className={`absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing transition-shadow select-none z-10 ${
            done
              ? 'bg-green-500 right-0 cursor-default'
              : 'bg-white shadow-md hover:shadow-lg'
          }`}
          style={!done ? { left: `calc(${pos}% - ${pos > 90 ? '40px' : pos > 10 ? `${pos * 0.4}px` : '0px'})` } : {}}
        >
          {done ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-5 h-5"><path d="M20 6L9 17l-5-5"/></svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" className="w-4 h-4"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          )}
        </div>
      </div>

      {done && <p className="text-xs text-green-400 mt-3">Verifikasi berhasil</p>}
    </div>
  )
}
