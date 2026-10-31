import { NextRequest } from 'next/server'
import { callSubscriberAuth, authFailureResponse, authLocale } from '@/lib/seller/auth-backend'
import { getSubscriberToken } from '@/lib/seller/auth'
import { z } from 'zod'

const AvatarSchema = z.object({ media_ulid: z.string().min(1) })

export async function PUT(request: NextRequest) {
  const token = await getSubscriberToken()
  if (!token) {
    return authFailureResponse({ ok: false, status: 401, errorCode: 'unauthenticated', message: 'Unauthenticated', fieldErrors: null })
  }
  const parsed = AvatarSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return authFailureResponse({ ok: false, status: 422, errorCode: 'validation_failed', message: 'Invalid request', fieldErrors: { media_ulid: ['Media is required'] } })
  }
  const result = await callSubscriberAuth('/subscriber/auth/avatar', {
    method: 'PUT', token, locale: authLocale(request), body: parsed.data,
  })
  return result.ok ? Response.json({ success: true, data: result.data }) : authFailureResponse(result)
}
