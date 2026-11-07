import 'server-only'
import { cookies } from 'next/headers'
import {
  BACKEND_API_KEY,
  BACKEND_API_URL,
} from '@/lib/seller/backend-client'

const ADMIN_COOKIE_NAME = 'token_admin'

async function getAdminToken(): Promise<string | null> {
  const store = await cookies()
  return store.get(ADMIN_COOKIE_NAME)?.value ?? null
}

/**
 * Ends an impersonation session with the admin token directly. This module
 * intentionally does not import lib/admin cookie readers so seller code can
 * never read the admin token outside this isolated operation.
 */
export async function endImpersonation(
  sessionUlid: string,
  locale: string,
): Promise<{ ok: boolean; status: number }> {
  const token = await getAdminToken()
  if (!token) return { ok: false, status: 401 }

  try {
    const response = await fetch(
      `${BACKEND_API_URL}/admin/impersonations/${encodeURIComponent(sessionUlid)}/end`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': BACKEND_API_KEY,
          'Accept-Language': locale === 'ar' ? 'ar' : 'en',
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      },
    )
    return { ok: response.ok, status: response.status }
  } catch {
    return { ok: false, status: 502 }
  }
}
