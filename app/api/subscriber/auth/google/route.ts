import { NextRequest, NextResponse } from 'next/server'
import {
  BACKEND_API_URL,
  subscriberHeaders,
} from '@/lib/seller/backend-client'
import { authLocale } from '@/lib/seller/auth-backend'
import { parseJsonSafely, normalizeEnvelope } from '@/lib/shared/api-envelope'

function safeRedirectTarget(value: string): URL | null {
  try {
    const url = new URL(value, BACKEND_API_URL)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null

    // TODO(backend): add any additional OAuth hosts if the backend uses them.
    const allowedHosts = new Set([
      new URL(BACKEND_API_URL).host,
      'accounts.google.com',
    ])
    return allowedHosts.has(url.host) ? url : null
  } catch {
    return null
  }
}

function unavailable() {
  return NextResponse.json(
    {
      success: false,
      message: 'Google sign-in is unavailable',
      error_code: 'oauth_unavailable',
      errors: null,
    },
    { status: 502 },
  )
}

export async function GET(request: NextRequest) {
  const locale = authLocale(request)

  try {
    const response = await fetch(`${BACKEND_API_URL}/subscriber/auth/google`, {
      headers: subscriberHeaders(locale),
      cache: 'no-store',
      redirect: 'manual',
    })

    const location = response.headers.get('location')
    if (response.status >= 300 && response.status < 400 && location) {
      const target = safeRedirectTarget(location)
      return target ? NextResponse.redirect(target) : unavailable()
    }

    const text = await response.text()
    const payload = parseJsonSafely(text)
    if (!payload) return unavailable()

    const envelope = normalizeEnvelope(payload, response.status)
    if (!response.ok || !envelope.success) return unavailable()

    const data = envelope.data
    if (
      typeof data === 'object' &&
      data !== null &&
      'url' in data &&
      typeof (data as { url?: unknown }).url === 'string'
    ) {
      const target = safeRedirectTarget((data as { url: string }).url)
      return target ? NextResponse.redirect(target) : unavailable()
    }

    // TODO(backend): confirm the OAuth callback landing and how the token is
    // transported back (query, fragment, or a server callback route).
    return unavailable()
  } catch {
    console.error('[seller-auth] Google OAuth redirect failed')
    return unavailable()
  }
}
