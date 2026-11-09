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
    const isFormData =
      typeof FormData !== 'undefined' && init?.body instanceof FormData

    const res = await fetch(`/api/admin${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        'x-locale': locale,
        'x-brand-id': brandId,
        ...(init?.headers as Record<string, string> | undefined),
      },
    })
    const text = await res.text()
    if (res.status === 204 || text.trim().length === 0) {
      return res.ok ? { ok: true, data: null as T } : { ok: false, message: `Request failed (${res.status})`, errorCode: `http_${res.status}`, errors: null, status: res.status }
    }
    const json = JSON.parse(text) as { success?: boolean; message?: string; error_code?: string; errors?: Record<string, string[]> | null; data?: unknown; meta?: unknown }

    if (!res.ok || !json?.success) {
      return {
        ok: false,
        message: json?.message ?? `Request failed (${res.status})`,
        errorCode: json?.error_code ?? 'unknown_error',
        errors: json?.errors ?? null,
        status: res.status,
      }
    }

    return { ok: true, data: json.data as T, meta: json.meta as import('@/lib/admin/api-server').ApiMeta | undefined }
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e
    return { ok: false, message: 'Network error', errorCode: 'network_error', errors: null, status: 0 }
  }
}
