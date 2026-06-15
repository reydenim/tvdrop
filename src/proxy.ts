import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Paths that bypass Turnstile
const BYPASS = [
  '/challenge',
  '/api/verify-turnstile',
  '/api/',  // All API routes
  '/sw.js',
  '/.well-known/',  // Monetag verification
  '/_next/',
  '/favicon.ico',
  '/favicon.svg',
  '/logo.png',
  '/manifest.json',
]

function isBypass(pathname: string): boolean {
  return BYPASS.some(p => pathname.startsWith(p))
}

export function proxy(request: NextRequest) {
  // Turnstile disabled — just pass through
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|favicon.ico|favicon.svg|logo.png|manifest.json).*)'],
}
