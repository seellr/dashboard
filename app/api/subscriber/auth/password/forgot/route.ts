import { NextRequest, NextResponse } from 'next/server'
import { ForgotPasswordSchema } from '@/types/dto/subscriber-auth.dto'
import {
  authFailureResponse,
  authLocale,
  callSubscriberAuth,
  validationFailure,
} from '@/lib/seller/auth-backend'

const NEUTRAL_MESSAGE =
  'If an account exists for this email, we sent a password reset link'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const parsed = ForgotPasswordSchema.safeParse(body)
  if (!parsed.success) {
    return authFailureResponse(validationFailure(parsed.error))
  }

  const result = await callSubscriberAuth('/subscriber/auth/password/forgot', {
    body: { email: parsed.data.email.trim().toLowerCase() },
    locale: authLocale(request),
  })

  if (!result.ok && (result.status === 429 || result.status >= 500)) {
    return authFailureResponse(result)
  }

  // Anti-enumeration: unknown emails and backend validation look identical.
  return NextResponse.json(
    { success: true, message: NEUTRAL_MESSAGE, data: null },
    { status: 200 },
  )
}
