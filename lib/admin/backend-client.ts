import 'server-only'

export const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1'
export const BACKEND_API_KEY = process.env.API_KEY ?? ''

/**
 * Every backend request needs x-api-key (ValidateApiKey is a global,
 * prepended middleware — no route is exempt) and Accept-Language (only
 * "en"/"ar" accepted; anything else 4xxs). Centralized here so no call
 * site duplicates or drifts on these two headers.
 */
export function backendHeaders(locale: string, token?: string | null): HeadersInit {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'x-api-key': BACKEND_API_KEY,
    'Accept-Language': locale === 'ar' || locale === 'en' ? locale : 'en',
    'X-Brand-Id': '1',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}
