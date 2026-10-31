import { NextRequest, NextResponse } from 'next/server'
import { VerifyEmailQuerySchema } from '@/types/dto/subscriber-auth.dto'
import {
  authFailureResponse,
  authLocale,
  callSubscriberAuth,
  validationFailure,
} from '@/lib/seller/auth-backend'

export async function GET(request: NextRequest) {
  const query = {
    ulid: request.nextUrl.searchParams.get('ulid') ?? '',
    hash: request.nextUrl.searchParams.get('hash') ?? '',
  }
  const parsed = VerifyEmailQuerySchema.safeParse(query)
  if (!parsed.success) {
    return authFailureResponse(validationFailure(parsed.error))
  }

  // TODO(backend): confirm the real verification-link format. The backend
  // contract is GET /subscriber/auth/email/verify/{ulid}/{hash}; this proxy
  // exposes it as a query-based route that the seller page can call.
  const result = await callSubscriberAuth(
    `/subscriber/auth/email/verify/${encodeURIComponent(parsed.data.ulid)}/${encodeURIComponent(parsed.data.hash)}`,
    {
      method: 'GET',
      locale: authLocale(request),
    },
  )

  if (!result.ok) {
    return authFailureResponse(result)
  }

  return NextResponse.json({
    success: true,
    message: result.message,
    data: null,
  })
}
