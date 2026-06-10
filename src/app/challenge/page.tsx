'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, opts: {
        sitekey: string
        callback: (token: string) => void
        theme?: string
      }) => string
      remove: (widgetId: string) => void
    }
    onTurnstileSuccess?: (token: string) => void
  }
}

const SITEKEY = '0x4AAAAAADiAWScG512Jsm7w'

function ChallengeInner() {
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect') || '/'
  const [status, setStatus] = useState('Memverifikasi...')
  const [failed, setFailed] = useState(false)
  const widgetRef = useRef<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load Turnstile script if not already loaded
    if (!document.querySelector('script[src*="turnstile"]')) {
      const script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
      script.async = true
      script.defer = true
      document.head.appendChild(script)

      // Poll until turnstile is available, then render
      const check = setInterval(() => {
        if (window.turnstile && containerRef.current) {
          clearInterval(check)
          const id = window.turnstile.render(containerRef.current, {
            sitekey: SITEKEY,
            callback: (token: string) => {
              setStatus('Memverifikasi...')
              verifyToken(token)
            },
            theme: 'dark',
          })
          widgetRef.current = id
        }
      }, 200)

      return () => clearInterval(check)
    }
  }, [])

  const verifyToken = async (token: string) => {
    try {
      const res = await fetch('/api/verify-turnstile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      if (res.ok) {
        window.location.href = redirectUrl
      } else {
        setStatus('Gagal verifikasi, muat ulang...')
        setFailed(true)
        setTimeout(() => window.location.reload(), 2000)
      }
    } catch {
      setStatus('Gagal verifikasi')
      setFailed(true)
    }
  }

  // Fallback manual button
  const retry = () => {
    setFailed(false)
    setStatus('Memverifikasi...')
    window.location.reload()
  }

  if (failed) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
        <div className="w-12 h-12 rounded-full bg-red-900/30 flex items-center justify-center mb-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" className="w-6 h-6">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
          </svg>
        </div>
        <p className="text-white text-sm mb-2">Gagal verifikasi</p>
        <p className="text-[#555] text-xs mb-6">Coba lagi atau refresh halaman</p>
        <button onClick={retry}
          className="px-6 py-2 bg-white text-black text-sm font-semibold rounded-full hover:bg-gray-200 transition">
          Coba Lagi
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <img src="/logo.png" alt="TVDROP" className="h-8 w-auto mb-8 opacity-50" />

      {/* Shield icon */}
      <div className="w-14 h-14 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-5 border border-[#333]">
        <svg viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.5" className="w-7 h-7">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      </div>

      <h1 className="text-white text-base font-semibold mb-2">Verifikasi Manusia</h1>
      <p className="text-[#555] text-xs mb-8 text-center max-w-sm">
        Selesaikan verifikasi untuk mengakses TVDROP
      </p>

      {/* Turnstile container */}
      <div ref={containerRef} className="mb-6" />

      {status && (
        <div className="flex items-center gap-2 text-[#555] text-xs">
          <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none"/>
            <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          {status}
        </div>
      )}
    </div>
  )
}

export default function ChallengePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <span className="dot-pulse"><span>.</span><span>.</span><span>.</span></span>
      </div>
    }>
      <ChallengeInner />
    </Suspense>
  )
}
