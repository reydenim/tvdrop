import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function GET() {
  const statusPath = path.join(process.cwd(), 'src/data/health_status.json')
  try {
    if (fs.existsSync(statusPath)) {
      const raw = fs.readFileSync(statusPath, 'utf-8')
      return NextResponse.json(JSON.parse(raw))
    }
  } catch {}
  return NextResponse.json({ status: 'not_scanned' })
}
