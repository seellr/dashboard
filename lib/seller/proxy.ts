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

    const headers = isMultipart
      ? subscriberMultipartHeaders(locale, token)
      : subscriberHeaders(locale, token)

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
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[subscriber-proxy] ${request.method} ${target}`)
    }

    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
    })

    const text = await upstream.text()
    if (upstream.status === 204 || text.trim().length === 0) {
      return new NextResponse(null, { status: upstream.status })
    }

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

    const isBareApiKeyFailure =
      typeof payload === 'object' &&
      payload !== null &&
      !('success' in payload) &&
      'message' in payload &&
      (payload as { message?: unknown }).message === 'Wrong way!'
    if (
      upstream.status === 401 &&
      resolved.access === 'subscriber' &&
      !isBareApiKeyFailure
    ) {
      await clearSessionOnUnauthorized()
    }

    return NextResponse.json(normalizeEnvelope(payload, upstream.status), {
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
