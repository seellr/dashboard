'use client'

import {
  apiFailure,
  type ApiResult,
} from '@/lib/shared/api-result'
import { normalizeEnvelope } from '@/lib/shared/api-envelope'

function browserLocale(): string {
  if (typeof document === 'undefined') return 'en'
  return document.documentElement.lang === 'ar' ? 'ar' : 'en'
}

function redirectToSellerLogin(locale: string): void {
  if (typeof window === 'undefined') return
  if (window.location.pathname.includes('/seller/login')) return

  const url = new URL(`/${locale}/seller/login`, window.location.origin)
  url.searchParams.set(
    'next',
    `${window.location.pathname}${window.location.search}`,
  )
  window.location.assign(url.toString())
}

/**
 * Browser-side wrapper for the subscriber proxy. It never talks to the backend
 * directly and handles the 204/empty-body and envelope rules in one place.
 */
export async function sellerFetchClient<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  const locale = browserLocale()
  const isFormData =
    typeof FormData !== 'undefined' && init?.body instanceof FormData

  try {
    const response = await fetch(`/api/subscriber${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        'x-locale': locale,
        ...(init?.body && !isFormData
          ? { 'Content-Type': 'application/json' }
          : {}),
        ...(init?.headers as Record<string, string> | undefined),
      },
    })

    const text = await response.text()

    if (response.status === 401) {
      redirectToSellerLogin(locale)
      return apiFailure(
        'Your session has expired. Redirecting to login…',
        'unauthenticated',
        401,
      )
    }

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
        'Invalid response from server',
        'invalid_response',
        502,
      )
    }

    const envelope = normalizeEnvelope(payload, response.status)
    if (!response.ok || !envelope.success) {
      return apiFailure(
        envelope.message ?? `Request failed (${response.status})`,
        envelope.error_code ??
          (response.status === 422 ? 'validation_failed' : 'request_failed'),
        response.status,
        envelope.errors ?? null,
      )
    }

    return {
      ok: true,
      data: (envelope.data ?? null) as T,
      meta: envelope.meta,
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }
    return apiFailure('Network error', 'network_error', 0)
  }
}
