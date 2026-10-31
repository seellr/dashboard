import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_API_URL, backendHeaders } from '@/lib/admin/backend-client'
import {
  authenticateAdminRequest,
  forwardToBackend,
  validationErrorResponse,
} from '@/lib/admin/server-media-proxy'
import { ProductFunnelSchema } from '@/types/dto/product.dto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ ulid: string }>
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const auth = await authenticateAdminRequest(request)
  if (!auth.ok) return auth.response
  const { token, locale, brandId } = auth.ctx
  const { ulid } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return validationErrorResponse({ _body: ['Invalid JSON payload.'] })
  }

  const parsed = ProductFunnelSchema.safeParse(body)
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {}
    for (const issue of parsed.error.issues) {
      const path = issue.path.join('.') || 'root'
      if (!fieldErrors[path]) fieldErrors[path] = []
      fieldErrors[path].push(issue.message)
    }
    return validationErrorResponse(fieldErrors)
  }

  const targetUrl = `${BACKEND_API_URL}/admin/products/${encodeURIComponent(ulid)}/funnel`

  return forwardToBackend(targetUrl, {
    method: 'PUT',
    headers: backendHeaders(locale, token, brandId),
    body: JSON.stringify(parsed.data),
  })
}
