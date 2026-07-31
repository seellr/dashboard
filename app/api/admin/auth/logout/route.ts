import { NextRequest, NextResponse } from 'next/server'
import { getAdminTokenCookie, clearAdminTokenCookie } from '@/lib/admin/auth'
import { BACKEND_API_URL, backendHeaders } from '@/lib/admin/backend-client'

export async function POST(request: NextRequest) {
  const token = await getAdminTokenCookie()
  const locale = request.headers.get('x-locale') ?? 'en'

  if (token) {
    await fetch(`${BACKEND_API_URL}/admin/auth/logout`, {
      method: 'POST',
      headers: backendHeaders(locale, token),
    }).catch(() => {})
  }

  await clearAdminTokenCookie()
  return NextResponse.json({ success: true })
}
