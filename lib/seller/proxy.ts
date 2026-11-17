import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import {
  getSubscriberToken,
  clearSubscriberTokenCookie,
} from '@/lib/seller/auth'
import {
  BACKEND_API_URL,
  subscriberHeaders,
  subscriberMultipartHeaders,
} from '@/lib/seller/backend-client'
import { resolveProxyTarget } from '@/lib/seller/mapping'
import { normalizeEnvelope } from '@/lib/shared/api-envelope'
import { normalizeMediaUrls } from '@/lib/shared/server-media-normalize'

const MEDIA_RESPONSE_KEYS: Record<string, readonly string[]> = {
  media: ['url', 'thumb_url'],
  products: ['url', 'thumb_url', 'hero_image_url', 'image_url'],
  themes: ['preview_url'],
}

/**
 * Only rewrite URL fields on resources that actually contain media. Builder
 * page/theme payloads also have a `url` setting for button links, so blanket
 * normalisation there would turn `/products/x` into a backend URL.
 */
function mediaKeysForRule(rule: string): readonly string[] | null {
  if (rule.startsWith('media')) return MEDIA_RESPONSE_KEYS.media
  if (rule.startsWith('product')) return MEDIA_RESPONSE_KEYS.products
  if (rule.startsWith('theme')) return MEDIA_RESPONSE_KEYS.themes
  return null
}

function errorResponse(
  message: string,
  errorCode: string,
  status: number,
): NextResponse {
  return NextResponse.json(
    { success: false, message, error_code: errorCode, errors: null },
    { status },
  )
}

async function clearSessionOnUnauthorized(): Promise<void> {
  await clearSubscriberTokenCookie()
}

export async function forwardSubscriberRequest(
  request: NextRequest,
  segments: string[],
): Promise<Response> {
  try {
    // Auth has dedicated route handlers. Never let the catch-all forward an
    // auth request (and therefore never let it touch the session cookie).
    if (segments[0] === 'auth') {
      return errorResponse('Not found', 'not_allowed', 404)
    }

    const resolved = resolveProxyTarget(request.method, segments)
    if (!resolved) {
      return errorResponse('Not found', 'not_allowed', 404)
    }

    const token = await getSubscriberToken()
    if (resolved.access === 'subscriber' && !token) {
      return errorResponse('Unauthenticated', 'unauthenticated', 401)
    }

    const locale = request.headers.get('x-locale') === 'ar' ? 'ar' : 'en'
    const contentType = request.headers.get('content-type') ?? ''
    const isMultipart = contentType.includes('multipart/form-data')

    const headers = new Headers(isMultipart
      ? subscriberMultipartHeaders(locale, token)
      : subscriberHeaders(locale, token))
    const idempotencyKey = request.headers.get('idempotency-key')
    if (idempotencyKey) headers.set('Idempotency-Key', idempotencyKey)

    const hasBody = request.method !== 'GET' && request.method !== 'HEAD'
    let body: BodyInit | undefined
    if (hasBody) {
      if (isMultipart) {
        // No manual Content-Type: the runtime writes the multipart boundary.
        body = await request.formData()
      } else {
        const text = await request.text()
        body = text.length > 0 ? text : undefined
      }
    }

    const target = `${BACKEND_API_URL}${resolved.target}${request.nextUrl.search}`
    const logProxy = process.env.NODE_ENV !== 'production'

    const upstream = await fetch(target, { method: request.method, headers, body, cache: 'no-store', redirect: 'manual' })
    if (logProxy) console.log(`[subscriber-proxy] ${request.method} ${target} -> ${upstream.status}`)

    if (upstream.status >= 300 && upstream.status < 400) {
      const location = upstream.headers.get('location')
      return location ? NextResponse.redirect(location, upstream.status) : errorResponse('Invalid redirect from upstream server', 'upstream_invalid_redirect', 502)
    }

    const text = await upstream.text()
    if (upstream.status === 204) {
      return new NextResponse(null, { status: upstream.status })
    }

    if (text.trim().length === 0) return new NextResponse(null, { status: upstream.status })

    let payload: unknown
    try {
      payload = JSON.parse(text) as unknown
    } catch {
      return errorResponse(
        'Invalid response from upstream server',
        'upstream_invalid_json',
        502,
      )
    }

    const isBareMessage =
      typeof payload === 'object' &&
      payload !== null &&
      !('success' in payload) &&
      'message' in payload
    if (upstream.status === 401 && isBareMessage) {
      return errorResponse(
        'The seller service is unavailable. Please try again later.',
        'service_misconfigured',
        502,
      )
    }

    if (upstream.status === 401 && resolved.access === 'subscriber') {
      await clearSessionOnUnauthorized()
    }

    const mediaKeys = mediaKeysForRule(resolved.rule)
    const normalizedPayload = mediaKeys
      ? normalizeMediaUrls(payload, {
          origin: new URL(BACKEND_API_URL).origin,
          keys: mediaKeys,
        })
      : payload

    return NextResponse.json(normalizeEnvelope(normalizedPayload, upstream.status), {
      status: upstream.status,
    })
  } catch {
    return errorResponse(
      'Bad Gateway: backend connection failed',
      'bad_gateway',
      502,
    )
  }
}
