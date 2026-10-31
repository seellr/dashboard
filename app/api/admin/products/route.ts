import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_API_URL, backendHeaders } from '@/lib/admin/backend-client'
import {
  authenticateAdminRequest,
  forwardToBackend,
  validationErrorResponse,
} from '@/lib/admin/server-media-proxy'
import {
  CreateProductSchema,
  ProductListResponseSchema,
  ProductSchema,
} from '@/types/dto/product.dto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await authenticateAdminRequest(request)
  if (!auth.ok) return auth.response
  const { token, locale, brandId } = auth.ctx

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
  const targetUrl = `${BACKEND_API_URL}/admin/products${query ? `?${query}` : ''}`

  const response = await forwardToBackend(targetUrl, {
    method: 'GET',
    headers: backendHeaders(locale, token, brandId),
    cache: 'no-store',
  })

  if (response.ok) {
    try {
      const clone = response.clone()
      const data = await clone.json()
      const parseResult = ProductListResponseSchema.safeParse(data)
      if (!parseResult.success) {
        console.error('[Products GET] Contract mismatch:', parseResult.error.format())
        return NextResponse.json(
          {
            success: false,
            message: 'Upstream products list contract mismatch',
            error_code: 'upstream_contract_error',
            errors: null,
          },
          { status: 502 },
        )
      }
    } catch (e) {
      console.error('[Products GET] Parse validation error:', e)
    }
  }

  return response
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await authenticateAdminRequest(request)
  if (!auth.ok) return auth.response
  const { token, locale, brandId } = auth.ctx

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return validationErrorResponse({ _body: ['Invalid JSON payload.'] })
  }

  const parsed = CreateProductSchema.safeParse(body)
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {}
    for (const issue of parsed.error.issues) {
      const path = issue.path.join('.') || 'root'
      if (!fieldErrors[path]) fieldErrors[path] = []
      fieldErrors[path].push(issue.message)
    }
    return validationErrorResponse(fieldErrors)
  }

  const targetUrl = `${BACKEND_API_URL}/admin/products`

  const response = await forwardToBackend(targetUrl, {
    method: 'POST',
    headers: backendHeaders(locale, token, brandId),
    body: JSON.stringify(parsed.data),
  })

  return response
}
