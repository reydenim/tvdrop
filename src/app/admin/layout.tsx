'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

const nav = [
  { href: '/admin', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/admin/channels', label: 'Channels', icon: 'M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z M8 10h8M8 14h4' },
  { href: '/admin/curated', label: 'Curated', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
  { href: '/admin/monitor', label: 'Monitor', icon: 'M12 20V10M18 20V4M6 20v-4' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const [open, setOpen] = useState(false)

  // Close sidebar on route change (mobile)
  useEffect(() => { setOpen(false) }, [path])

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const isActive = (href: string) => {
    if (href === '/admin') return path === '/admin'
    return path.startsWith(href)
  }

  const sidebar = (
    <aside className="w-[240px] bg-[#0a0a0a] border-r border-[#222] flex flex-col h-full">
      {/* Brand */}
      <div className="px-4 py-5 border-b border-[#222]">
        <Link href="/admin" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <img src="/logo.png" alt="TVDROP" className="h-6 w-auto" />
          <span className="text-xs text-[#555]">Admin</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {nav.map(({ href, label, icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition ${
                active
                  ? 'bg-[#1a1a1a] text-white font-medium'
                  : 'text-[#666] hover:text-white hover:bg-[#111]'
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 flex-shrink-0">
                <path d={icon} />
              </svg>
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Back to site */}
      <div className="px-2 py-3 border-t border-[#222]">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[#555] hover:text-white hover:bg-[#111] transition"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
            <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali ke TV
        </Link>
      </div>
    </aside>
  )

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Desktop sidebar — always visible */}
      <div className="hidden md:flex h-screen sticky top-0">
        {sidebar}
      </div>

      {/* Mobile sidebar — overlay */}
      {open && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 md:hidden animate-slide-right">
            {sidebar}
          </div>
        </>
      )}

      {/* Content */}
      <main className="flex-1 overflow-auto min-h-screen">
        {/* Mobile header with hamburger */}
        <div className="sticky top-0 z-30 md:hidden bg-black/80 backdrop-blur border-b border-[#222] px-4 py-3 flex items-center gap-3">
          <button onClick={() => setOpen(true)} className="text-white p-1 -ml-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="TVDROP" className="h-5 w-auto" />
            <span className="text-[10px] text-[#555]">Admin</span>
          </Link>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          {children}
        </div>
      </main>
    </div>
  )
}
