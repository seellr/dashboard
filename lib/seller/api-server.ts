import 'server-only'
import { getLocale } from 'next-intl/server'
import { getSubscriberToken } from '@/lib/seller/auth'
import {
  BACKEND_API_URL,
  subscriberHeaders,
} from '@/lib/seller/backend-client'
import {
  apiFailure,
  type ApiResult,
} from '@/lib/shared/api-result'
import { normalizeEnvelope } from '@/lib/shared/api-envelope'

/**
 * Server-side subscriber fetch. Used by server components/layouts only; browser
 * code must go through /api/subscriber via lib/seller/api-client.ts.
 */
export async function sellerFetchServer<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  const token = await getSubscriberToken()
  if (!token) {
    return apiFailure('Unauthenticated', 'unauthenticated', 401)
  }

  const locale = await getLocale()

  try {
    const response = await fetch(`${BACKEND_API_URL}${path}`, {
      ...init,
      headers: {
        ...subscriberHeaders(locale, token),
        ...(init?.headers as Record<string, string> | undefined),
      },
      cache: 'no-store',
    })

    const text = await response.text()
    if (response.status === 204 || text.trim().length === 0) {
      if (response.ok) {
        return { ok: true, data: null as T }
      }
      return apiFailure(
        `Request failed (${response.status})`,
        `http_${response.status}`,
        response.status,
      )
    }

    let payload: unknown
    try {
      payload = JSON.parse(text) as unknown
    } catch {
      return apiFailure(
        'Invalid response from upstream server',
        'upstream_invalid_json',
        502,
      )
    }

    const envelope = normalizeEnvelope(payload, response.status)
    if (!response.ok || !envelope.success) {
      return apiFailure(
        envelope.message ?? `Request failed (${response.status})`,
        envelope.error_code ?? (response.status === 422 ? 'validation_failed' : 'request_failed'),
        response.status,
        envelope.errors ?? null,
      )
    }

    return {
      ok: true,
      data: (envelope.data ?? null) as T,
      meta: envelope.meta,
    }
  } catch {
    return apiFailure(
      'Bad Gateway: backend connection failed',
      'bad_gateway',
      502,
    )
  }
}
