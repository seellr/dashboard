import 'server-only'

export const BACKEND_API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1'
export const BACKEND_API_KEY = process.env.API_KEY ?? ''

function normalizeLocale(locale: string): 'ar' | 'en' {
  return locale === 'ar' ? 'ar' : 'en'
}

/**
 * Subscriber requests never include X-Brand-Id: it is ignored for stores and
 * the store is resolved from the subscriber token instead.
 */
export function subscriberHeaders(
  locale: string,
  token?: string | null,
): HeadersInit {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'x-api-key': BACKEND_API_KEY,
    'Accept-Language': normalizeLocale(locale),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

/**
 * Multipart must not set Content-Type: the runtime generates the boundary.
 */
export function subscriberMultipartHeaders(
  locale: string,
  token?: string | null,
): HeadersInit {
  return {
    Accept: 'application/json',
    'x-api-key': BACKEND_API_KEY,
    'Accept-Language': normalizeLocale(locale),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}
