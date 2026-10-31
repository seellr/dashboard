import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_API_URL, backendHeaders } from '@/lib/admin/backend-client'
import {
  authenticateAdminRequest,
  forwardToBackend,
} from '@/lib/admin/server-media-proxy'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ ulid: string; itemUlid: string }>
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const auth = await authenticateAdminRequest(request)
  if (!auth.ok) return auth.response
  const { token, locale, brandId } = auth.ctx
  const { ulid, itemUlid } = await params

  const targetUrl = `${BACKEND_API_URL}/admin/products/${encodeURIComponent(ulid)}/bundle-items/${encodeURIComponent(itemUlid)}`

  return forwardToBackend(targetUrl, {
    method: 'DELETE',
    headers: backendHeaders(locale, token, brandId),
  })
}
