import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_API_URL, backendHeaders } from '@/lib/admin/backend-client'
import {
  authenticateAdminRequest,
  forwardToBackend,
  validationErrorResponse,
} from '@/lib/admin/server-media-proxy'
import { BulkDeleteSchema } from '@/types/dto/media.dto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await authenticateAdminRequest(request)
  if (!auth.ok) return auth.response
  const { token, locale } = auth.ctx

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return validationErrorResponse({ _body: ['Invalid JSON payload.'] })
  }

  const parsed = BulkDeleteSchema.safeParse(body)
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {}
    for (const issue of parsed.error.issues) {
      const path = issue.path.join('.') || 'ulids'
      if (!fieldErrors[path]) fieldErrors[path] = []
      fieldErrors[path].push(issue.message)
    }
    return validationErrorResponse(fieldErrors)
  }

  const targetUrl = `${BACKEND_API_URL}/admin/media/bulk-delete`

  return forwardToBackend(targetUrl, {
    method: 'POST',
    headers: backendHeaders(locale, token),
    body: JSON.stringify(parsed.data),
  })
}
