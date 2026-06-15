import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  const referer = req.nextUrl.searchParams.get('ref')
  const ua = req.nextUrl.searchParams.get('ua')
  const origin = req.nextUrl.searchParams.get('origin')

  if (!url) return NextResponse.json({ error: 'missing url' }, { status: 400 })

  try {
    const headers: Record<string, string> = {
      'User-Agent': ua || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    }
    if (referer) headers['Referer'] = referer
    if (origin) headers['Origin'] = origin

    const resp = await fetch(url, { headers, redirect: 'follow' })
    const contentType = resp.headers.get('content-type') || 'application/octet-stream'

    if (!resp.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${resp.status}`, upstream_status: resp.status },
        { status: resp.status }
      )
    }

    if (contentType.includes('text') || url.includes('.m3u8') || url.includes('.m3u')) {
      // Rewrite playlist: prepend proxy URL to segment URIs
      let body = await resp.text()
      const proxyBase = `/api/proxy?ref=${encodeURIComponent(referer || '')}&ua=${encodeURIComponent(ua || '')}&url=`

      // Rewrite relative and absolute segment URLs
      body = body.replace(/^(?!#)([^\s#]+\.(ts|m3u8|key|bin))\s*$/gm, (match, segment) => {
        if (segment.startsWith('http')) {
          return proxyBase + encodeURIComponent(segment)
        }
        // Relative URL: resolve against the playlist base URL
        const base = url.substring(0, url.lastIndexOf('/') + 1)
        const resolved = new URL(segment, base).href
        return proxyBase + encodeURIComponent(resolved)
      })

      return new NextResponse(body, {
        headers: {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache',
        },
      })
    }

    // Binary content (TS segments, etc.) — stream through
    return new NextResponse(resp.body, {
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=30',
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 502 })
  }
}
