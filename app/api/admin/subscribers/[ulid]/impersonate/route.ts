import { NextRequest, NextResponse } from 'next/server'
import { getAdminTokenCookie } from '@/lib/admin/auth'
import { BACKEND_API_KEY, BACKEND_API_URL } from '@/lib/admin/backend-client'
import { setImpersonationCookie, setSubscriberTokenCookie } from '@/lib/seller/auth'

export async function POST(request: NextRequest, { params }: { params: Promise<{ ulid: string }> }) {
  const adminToken = await getAdminTokenCookie()
  if (!adminToken) return NextResponse.json({ success: false, error_code: 'unauthenticated', message: 'Unauthenticated' }, { status: 401 })
  const { ulid } = await params
  try {
    const upstream = await fetch(`${BACKEND_API_URL}/admin/subscribers/${encodeURIComponent(ulid)}/impersonate`, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'x-api-key': BACKEND_API_KEY, 'Accept-Language': request.headers.get('x-locale') === 'ar' ? 'ar' : 'en', Authorization: `Bearer ${adminToken}` }, cache: 'no-store' })
    const payload = await upstream.json().catch(() => null) as { success?: boolean; message?: string; error_code?: string; data?: { access_token?: string; token?: string; expires_in?: number; session_ulid?: string; subscriber?: { name?: string | null }; user?: { name?: string | null } } } | null
    const accessToken = payload?.data?.access_token ?? payload?.data?.token
    if (!upstream.ok || !payload?.success || !accessToken) return NextResponse.json({ success: false, message: payload?.message ?? 'Impersonation failed', error_code: payload?.error_code ?? 'impersonation_failed' }, { status: upstream.status || 502 })
    const sessionUlid = payload.data?.session_ulid
    if (sessionUlid) await setImpersonationCookie({ session_ulid: sessionUlid, name: payload.data?.subscriber?.name ?? payload.data?.user?.name ?? ulid }, Math.min(payload.data?.expires_in ?? 3600, 3600))
    await setSubscriberTokenCookie(accessToken, Math.min(payload.data?.expires_in ?? 3600, 3600))
    return NextResponse.json({ success: true, data: { impersonating: true } })
  } catch { return NextResponse.json({ success: false, message: 'Bad Gateway: backend connection failed', error_code: 'bad_gateway' }, { status: 502 }) }
}
