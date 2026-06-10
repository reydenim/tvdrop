import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // Allow challenge page, API, static assets, admin (protected by nginx basic auth)
  if (
    pathname === '/challenge' ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/admin') ||
    pathname === '/monitor.html' ||
    pathname.startsWith('/_next/static') ||
    pathname === '/favicon.ico' ||
    pathname === '/favicon.svg' ||
    pathname === '/manifest.json' ||
    pathname === '/logo.png'
  ) {
    return NextResponse.next()
  }

  // Check tv_pass cookie
  const tvPass = request.cookies.get('tv_pass')
  if (!tvPass?.value) {
    // Use real host/proto from headers (behind nginx + CF proxy)
    const host = request.headers.get('host') || 'tv.drop.my.id'
    const proto = request.headers.get('x-forwarded-proto') || 'https'
    const originalUrl = `${proto}://${host}${pathname}${search}`

    const url = new URL('/challenge', originalUrl)
    url.searchParams.set('redirect', originalUrl)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|favicon.ico|favicon.svg|logo.png|manifest.json).*)'],
}
