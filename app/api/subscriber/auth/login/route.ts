import { NextRequest, NextResponse } from 'next/server'
import { LoginRequestSchema, LoginResponseSchema } from '@/types/dto/subscriber-auth.dto'
import { setSubscriberTokenCookie } from '@/lib/seller/auth'
import {
  authFailureResponse,
  authLocale,
  callSubscriberAuth,
  parseAuthData,
  validationFailure,
} from '@/lib/seller/auth-backend'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const parsed = LoginRequestSchema.safeParse(body)
  if (!parsed.success) {
    return authFailureResponse(validationFailure(parsed.error))
  }

  const result = await callSubscriberAuth('/subscriber/auth/login', {
    body: {
      identifier: parsed.data.identifier.trim(),
      password: parsed.data.password,
    },
    locale: authLocale(request),
  })

  if (!result.ok) {
    if (result.status === 401 && result.errorCode === 'unauthenticated') {
      return authFailureResponse({
        ...result,
        errorCode: 'auth_invalid_credentials',
        message: 'Invalid email or password',
      })
    }
    return authFailureResponse(result)
  }

  const data = parseAuthData(
    LoginResponseSchema,
    result,
    '/subscriber/auth/login',
  )
  if (!data.ok) {
    return authFailureResponse(data)
  }

  await setSubscriberTokenCookie(
    data.data.access_token,
    data.data.expires_in,
  )

  // The access token is intentionally never returned to the browser.
  return NextResponse.json({
    success: true,
    data: { user: data.data.user },
  })
}
