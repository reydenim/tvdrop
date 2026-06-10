import { NextRequest, NextResponse } from 'next/server'

const SECRET_KEY = '0x4AAAAAADiAWWRGAKjeqiOSQMNbU4q4sAI'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ success: false }, { status: 400 })
    }

    // Verify with Cloudflare
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: SECRET_KEY,
        response: token,
      }),
    })

    const data = await res.json()

    if (data.success) {
      const response = NextResponse.json({ success: true })
      response.cookies.set('tv_pass', '1', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 86400, // 24 hours
        path: '/',
      })
      return response
    }

    console.error('Turnstile verify failed:', data['error-codes'])
    return NextResponse.json({ success: false, errors: data['error-codes'] }, { status: 400 })
  } catch (err) {
    console.error('Verify error:', err)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
