import { NextRequest, NextResponse } from 'next/server'
import { ResetPasswordSchema } from '@/types/dto/subscriber-auth.dto'
import {
  authFailureResponse,
  authLocale,
  callSubscriberAuth,
  validationFailure,
} from '@/lib/seller/auth-backend'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const parsed = ResetPasswordSchema.safeParse(body)
  if (!parsed.success) {
    return authFailureResponse(validationFailure(parsed.error))
  }

  const result = await callSubscriberAuth('/subscriber/auth/password/reset', {
    body: {
      token: parsed.data.token,
      email: parsed.data.email.trim().toLowerCase(),
      password: parsed.data.password,
      password_confirmation: parsed.data.password_confirmation,
    },
    locale: authLocale(request),
  })

  if (!result.ok) {
    return authFailureResponse(result)
  }

  return NextResponse.json({ success: true, data: null })
}
