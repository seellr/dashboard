import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_API_URL, backendHeaders } from '@/lib/admin/backend-client'
import {
  authenticateAdminRequest,
  forwardToBackend,
  validationErrorResponse,
} from '@/lib/admin/server-media-proxy'
import { MediaSingleResponseSchema, UpdateMediaSchema } from '@/types/dto/media.dto'

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
  const { token, locale } = auth.ctx
  const { ulid } = await params

  const targetUrl = `${BACKEND_API_URL}/admin/media/${ulid}`

  const response = await forwardToBackend(targetUrl, {
    method: 'GET',
    headers: backendHeaders(locale, token),
    cache: 'no-store',
  })

  if (response.ok) {
    try {
      const clone = response.clone()
      const data = await clone.json()
      const parseResult = MediaSingleResponseSchema.safeParse(data)
      if (!parseResult.success) {
        console.error('[Media Details GET] Contract mismatch:', parseResult.error.format())
        return NextResponse.json(
          {
            success: false,
            message: 'Upstream media details contract mismatch',
            error_code: 'upstream_contract_error',
            errors: null,
          },
          { status: 502 },
        )
      }
    } catch (e) {
      console.error('[Media Details GET] Failed to parse response:', e)
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
  const { token, locale } = auth.ctx
  const { ulid } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return validationErrorResponse({ _body: ['Invalid JSON payload.'] })
  }

  const parsed = UpdateMediaSchema.safeParse(body)
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {}
    for (const issue of parsed.error.issues) {
      const path = issue.path.join('.') || 'root'
      if (!fieldErrors[path]) fieldErrors[path] = []
      fieldErrors[path].push(issue.message)
    }
    return validationErrorResponse(fieldErrors)
  }

  const targetUrl = `${BACKEND_API_URL}/admin/media/${ulid}`

  const response = await forwardToBackend(targetUrl, {
    method: 'PUT',
    headers: backendHeaders(locale, token),
    body: JSON.stringify(parsed.data),
  })

  if (response.ok) {
    try {
      const clone = response.clone()
      const data = await clone.json()
      const parseResult = MediaSingleResponseSchema.safeParse(data)
      if (!parseResult.success) {
        console.error('[Media PUT] Contract mismatch:', parseResult.error.format())
        return NextResponse.json(
          {
            success: false,
            message: 'Upstream media update contract mismatch',
            error_code: 'upstream_contract_error',
            errors: null,
          },
          { status: 502 },
        )
      }
    } catch (e) {
      console.error('[Media PUT] Failed to parse response:', e)
    }
  }

  return response
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const auth = await authenticateAdminRequest(request)
  if (!auth.ok) return auth.response
  const { token, locale } = auth.ctx
  const { ulid } = await params

  const targetUrl = `${BACKEND_API_URL}/admin/media/${ulid}`

  return forwardToBackend(targetUrl, {
    method: 'DELETE',
    headers: backendHeaders(locale, token),
  })
}
