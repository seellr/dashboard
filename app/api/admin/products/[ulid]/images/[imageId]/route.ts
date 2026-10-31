import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_API_URL, backendHeaders } from '@/lib/admin/backend-client'
import {
  authenticateAdminRequest,
  forwardToBackend,
  validationErrorResponse,
} from '@/lib/admin/server-media-proxy'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ ulid: string; imageId: string }>
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const auth = await authenticateAdminRequest(request)
  if (!auth.ok) return auth.response
  const { token, locale } = auth.ctx
  const { ulid, imageId } = await params

  if (!imageId || isNaN(Number(imageId))) {
    return validationErrorResponse(
      { imageId: ['Image ID must be a numeric identifier.'] },
      'Invalid image identifier.',
    )
  }

  const targetUrl = `${BACKEND_API_URL}/admin/products/${ulid}/images/${imageId}`

  return forwardToBackend(targetUrl, {
    method: 'DELETE',
    headers: backendHeaders(locale, token),
  })
}
