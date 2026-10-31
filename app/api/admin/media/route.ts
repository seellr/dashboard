import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_API_URL, backendHeaders } from '@/lib/admin/backend-client'
import {
  authenticateAdminRequest,
  forwardToBackend,
  validationErrorResponse,
} from '@/lib/admin/server-media-proxy'
import { MediaListResponseSchema } from '@/types/dto/media.dto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await authenticateAdminRequest(request)
  if (!auth.ok) return auth.response
  const { token, locale } = auth.ctx

  const searchParams = request.nextUrl.searchParams
  const perPageStr = searchParams.get('per_page')
  if (perPageStr) {
    const perPage = Number(perPageStr)
    if (isNaN(perPage) || perPage < 1 || perPage > 100) {
      return validationErrorResponse({
        per_page: ['per_page must be an integer between 1 and 100.'],
      })
    }
  }

  const query = searchParams.toString()
  const targetUrl = `${BACKEND_API_URL}/admin/media${query ? `?${query}` : ''}`

  const response = await forwardToBackend(targetUrl, {
    method: 'GET',
    headers: backendHeaders(locale, token),
    cache: 'no-store',
  })

  // If response is successful, validate response shape with safeParse
  if (response.ok) {
    try {
      const clone = response.clone()
      const data = await clone.json()
      const parseResult = MediaListResponseSchema.safeParse(data)
      if (!parseResult.success) {
        console.error('[Media API GET] Upstream response validation failed:', parseResult.error.format())
        return NextResponse.json(
          {
            success: false,
            message: 'Upstream media list contract mismatch',
            error_code: 'upstream_contract_error',
            errors: null,
          },
          { status: 502 },
        )
      }
    } catch (e) {
      console.error('[Media API GET] Failed to validate list response:', e)
    }
  }

  return response
}
