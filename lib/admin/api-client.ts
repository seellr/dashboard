'use client'

import type { ApiResult } from '@/lib/admin/api-server'

export async function adminFetchClient<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    // API routes live outside app/[locale]/*, so next-intl's server-side
    // getLocale() has no route-segment signal there. <html lang> (set once,
    // in the root layout, from the actual locale param) is the reliable
    // client-side source of truth instead of threading locale through
    // every hook/component that calls this function.
    const locale = typeof document !== 'undefined' ? document.documentElement.lang : 'en'
    const brandId = typeof window !== 'undefined'
      ? (localStorage.getItem('admin_active_brand_id') ?? '1')
      : '1'

    const res = await fetch(`/api/admin${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'x-locale': locale,
        'x-brand-id': brandId,
        ...(init?.headers as Record<string, string> | undefined),
      },
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
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e
    return { ok: false, message: 'Network error', errorCode: 'network_error', errors: null, status: 0 }
  }
}
