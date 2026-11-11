import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_API_URL, backendHeaders } from '@/lib/admin/backend-client'
import {
  authenticateAdminRequest,
  forwardToBackend,
  normalizeMediaUrls,
  validationErrorResponse,
} from '@/lib/admin/server-media-proxy'
import { UpdateProductSchema } from '@/types/dto/product.dto'

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

  const targetUrl = `${BACKEND_API_URL}/admin/products/${encodeURIComponent(ulid)}`

  const response = await forwardToBackend(targetUrl, {
    method: 'GET',
    headers: backendHeaders(locale, token, brandId),
    cache: 'no-store',
  })

  if (response.ok) {
    try {
      const clone = response.clone()
      const data = await clone.json()
      return NextResponse.json(normalizeMediaUrls(data), { status: response.status })
    } catch {
      // If parsing fails, return the original response as-is
    }
  }

  return response
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

  const parsed = UpdateProductSchema.safeParse(body)
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {}
    for (const issue of parsed.error.issues) {
      const path = issue.path.join('.') || 'root'
      if (!fieldErrors[path]) fieldErrors[path] = []
      fieldErrors[path].push(issue.message)
    }
    return validationErrorResponse(fieldErrors)
  }

  const targetUrl = `${BACKEND_API_URL}/admin/products/${encodeURIComponent(ulid)}`

  return forwardToBackend(targetUrl, {
    method: 'PUT',
    headers: backendHeaders(locale, token, brandId),
    body: JSON.stringify(parsed.data),
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const auth = await authenticateAdminRequest(request)
  if (!auth.ok) return auth.response
  const { token, locale, brandId } = auth.ctx
  const { ulid } = await params

  const targetUrl = `${BACKEND_API_URL}/admin/products/${encodeURIComponent(ulid)}`

  return forwardToBackend(targetUrl, {
    method: 'DELETE',
    headers: backendHeaders(locale, token, brandId),
  })
}
