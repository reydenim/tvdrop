import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

const MATCHES_PATH = '/home/ubuntu/.hermes/data/tigoals_live.json'

export async function GET() {
  try {
    if (!fs.existsSync(MATCHES_PATH)) {
      return NextResponse.json({ live: false, updated: null, matches: [] })
    }
    const data = JSON.parse(fs.readFileSync(MATCHES_PATH, 'utf-8'))
    const response = NextResponse.json(data)
    response.headers.set('Cache-Control', 'public, max-age=60')
    return response
  } catch {
    return NextResponse.json({ live: false, updated: null, matches: [], error: 'failed to read' })
  }
}
