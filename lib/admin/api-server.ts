import 'server-only'
import { getLocale } from 'next-intl/server'
import { getAdminTokenCookie } from '@/lib/admin/auth'
import { BACKEND_API_URL, backendHeaders } from '@/lib/admin/backend-client'

export interface ApiMeta {
  per_page: number
  next_cursor: string | null
  has_more: boolean
}

export interface ApiSuccess<T> {
  ok: true
  data: T
  meta?: ApiMeta
}

export interface ApiFailure {
  ok: false
  message: string
  errorCode: string
  errors: Record<string, string[]> | null
  status: number
}

export type ApiResult<T> = ApiSuccess<T> | ApiFailure

export async function adminFetchServer<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  const token = await getAdminTokenCookie()
  const locale = await getLocale()

  const res = await fetch(`${BACKEND_API_URL}${path}`, {
    ...init,
    headers: {
      ...backendHeaders(locale, token),
      ...(init?.headers as Record<string, string> | undefined),
    },
    cache: 'no-store',
  })

  const json = await res.json().catch(() => null)

  if (!res.ok || !json?.success) {
    return {
      ok: false,
      message: json?.message ?? `Request failed (${res.status})`,
      errorCode: json?.error_code ?? 'unknown_error',
      errors: json?.errors ?? null,
      status: res.status,
    }
  }

  return { ok: true, data: json.data as T, meta: json.meta }
}
