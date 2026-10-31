import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_API_URL, backendHeaders } from '@/lib/admin/backend-client'
import {
  authenticateAdminRequest,
  forwardToBackend,
  validationErrorResponse,
} from '@/lib/admin/server-media-proxy'
import { ProductBundleItemSchema } from '@/types/dto/product.dto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ ulid: string }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const auth = await authenticateAdminRequest(request)
  if (!auth.ok) return auth.response
  const { token, locale, brandId } = auth.ctx
  const { ulid } = await params

  const targetUrl = `${BACKEND_API_URL}/admin/products/${encodeURIComponent(ulid)}/bundle-items`

  return forwardToBackend(targetUrl, {
    method: 'GET',
    headers: backendHeaders(locale, token, brandId),
    cache: 'no-store',
  })
}

export async function POST(
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

  const parsed = ProductBundleItemSchema.safeParse(body)
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {}
    for (const issue of parsed.error.issues) {
      const path = issue.path.join('.') || 'root'
      if (!fieldErrors[path]) fieldErrors[path] = []
      fieldErrors[path].push(issue.message)
    }
    return validationErrorResponse(fieldErrors)
  }

  // Cross-field validation: block self-bundling
  if (parsed.data.item_ulid === ulid) {
    return NextResponse.json(
      {
        success: false,
        message: 'A product cannot be added to its own bundle.',
        error_code: 'product_self_bundle_not_allowed',
        errors: { item_ulid: ['A product cannot be added to its own bundle.'] },
      },
      { status: 422 },
    )
  }

  const targetUrl = `${BACKEND_API_URL}/admin/products/${encodeURIComponent(ulid)}/bundle-items`

  return forwardToBackend(targetUrl, {
    method: 'POST',
    headers: backendHeaders(locale, token, brandId),
    body: JSON.stringify(parsed.data),
  })
}
