import { NextRequest, NextResponse } from 'next/server'
import { MeResponseSchema } from '@/types/dto/subscriber-auth.dto'
import {
  clearSubscriberTokenCookie,
  getSubscriberToken,
} from '@/lib/seller/auth'
import {
  authFailureResponse,
  authLocale,
  callSubscriberAuth,
  parseAuthData,
} from '@/lib/seller/auth-backend'

function unauthenticated(request: NextRequest) {
  const accept = request.headers.get('accept') ?? ''
  if (accept.includes('text/html')) {
    const locale = authLocale(request)
    return NextResponse.redirect(
      new URL(`/${locale}/seller/login?expired=1`, request.url),
    )
  }

  return authFailureResponse({
    ok: false,
    status: 401,
    errorCode: 'unauthenticated',
    message: 'Unauthenticated',
    fieldErrors: null,
  })
}

export async function GET(request: NextRequest) {
  const token = await getSubscriberToken()
  if (!token) {
    return unauthenticated(request)
  }

  const result = await callSubscriberAuth('/subscriber/auth/me', {
    method: 'GET',
    token,
    locale: authLocale(request),
  })

  if (!result.ok) {
    if (result.status === 401) {
      await clearSubscriberTokenCookie()
      return unauthenticated(request)
    }
    return authFailureResponse(result)
  }

  const parsed = parseAuthData(
    MeResponseSchema,
    result,
    '/subscriber/auth/me',
  )
  if (!parsed.ok) {
    return authFailureResponse(parsed)
  }

  const user = 'user' in parsed.data ? parsed.data.user : parsed.data
  return NextResponse.json({ success: true, data: { user } })
}
