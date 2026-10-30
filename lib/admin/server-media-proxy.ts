import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminTokenCookie } from '@/lib/admin/auth'
import {
  BACKEND_API_URL,
  backendHeaders,
  backendMultipartHeaders,
} from '@/lib/admin/backend-client'

export interface ProxyContext {
  token: string
  locale: string
  brandId: string
}

/**
 * Validates admin authentication and extracts locale and brand headers.
 * Returns either the context or an unauthenticated 401 response.
 */
export async function authenticateAdminRequest(
  request: NextRequest,
): Promise<{ ok: true; ctx: ProxyContext } | { ok: false; response: NextResponse }> {
  const token = await getAdminTokenCookie()

  if (!token) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          message: 'Unauthenticated',
          error_code: 'unauthenticated',
          errors: null,
        },
        { status: 401 },
      ),
    }
  }

  const locale = request.headers.get('x-locale') ?? 'en'
  const brandId = request.headers.get('x-brand-id') ?? '1'

  return {
    ok: true,
    ctx: { token, locale, brandId },
  }
}

/**
 * Builds a standardized 422 validation failed response.
 */
export function validationErrorResponse(
  errors: Record<string, string[]>,
  message = 'The given data was invalid.',
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      message,
      error_code: 'validation_failed',
      errors,
    },
    { status: 422 },
  )
}

/**
 * Handles forwarding a fetch request to the backend with robust error handling,
 * 204 empty-body handling, 401 normalization, and 502 on network/connection failure.
 */
export async function forwardToBackend(
  url: string,
  init: RequestInit,
): Promise<NextResponse> {
  try {
    const res = await fetch(url, init)

    // Handle 204 No Content or zero Content-Length
    if (res.status === 204 || res.headers.get('content-length') === '0') {
      return new NextResponse(null, { status: 204 })
    }

    const text = await res.text()
    if (!text || text.trim().length === 0) {
      return new NextResponse(null, { status: res.status })
    }

    let json: Record<string, unknown> | null = null
    try {
      json = JSON.parse(text)
    } catch (parseError) {
      console.error('[Backend Proxy] Failed to parse backend JSON response:', parseError, 'Raw body:', text)
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid response from upstream server',
          error_code: 'upstream_invalid_json',
          errors: null,
        },
        { status: 502 },
      )
    }

    // Backend sometimes returns raw 401 { message: "Wrong way!" } without envelope
    if (res.status === 401 && json && typeof json === 'object' && !('success' in json)) {
      return NextResponse.json(
        {
          success: false,
          message: (json.message as string) || 'Unauthenticated',
          error_code: 'unauthenticated',
          errors: null,
        },
        { status: 401 },
      )
    }

    return NextResponse.json(json, { status: res.status })
  } catch (err) {
    console.error(`[Backend Proxy] Connection failure fetching ${url}:`, err)
    return NextResponse.json(
      {
        success: false,
        message: 'Bad Gateway: Backend connection failed',
        error_code: 'bad_gateway',
        errors: null,
      },
      { status: 502 },
    )
  }
}
