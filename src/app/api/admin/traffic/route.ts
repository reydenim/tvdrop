import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const dataPath = path.join(process.cwd(), 'src/data/traffic_data.json')
    const raw = fs.readFileSync(dataPath, 'utf-8')
    return NextResponse.json(JSON.parse(raw))
  } catch {
    return NextResponse.json({ error: 'No traffic data yet' }, { status: 503 })
  }
}
