import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_API_URL, backendHeaders } from '@/lib/admin/backend-client'
import {
  authenticateAdminRequest,
  forwardToBackend,
} from '@/lib/admin/server-media-proxy'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await authenticateAdminRequest(request)
  if (!auth.ok) return auth.response
  const { token, locale } = auth.ctx

  const targetUrl = `${BACKEND_API_URL}/admin/media/folders`

  return forwardToBackend(targetUrl, {
    method: 'GET',
    headers: backendHeaders(locale, token),
    cache: 'no-store',
  })
}
