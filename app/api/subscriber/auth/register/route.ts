import { NextRequest, NextResponse } from 'next/server'
import {
  RegisterRequestSchema,
  type AuthFieldErrors,
} from '@/types/dto/subscriber-auth.dto'
import {
  authFailureResponse,
  authLocale,
  callSubscriberAuth,
  validationFailure,
} from '@/lib/seller/auth-backend'

const NEUTRAL_MESSAGE =
  'If this email can be registered, we sent a verification link'

function withoutEmailErrors(errors: AuthFieldErrors | null): AuthFieldErrors {
  if (!errors) return {}

  return Object.fromEntries(
    Object.entries(errors).filter(
      ([field]) => !field.toLowerCase().includes('email'),
    ),
  )
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const parsed = RegisterRequestSchema.safeParse(body)
  if (!parsed.success) {
    return authFailureResponse(validationFailure(parsed.error))
  }

  const result = await callSubscriberAuth('/subscriber/auth/register', {
    body: {
      ...parsed.data,
      email: parsed.data.email.trim().toLowerCase(),
    },
    locale: authLocale(request),
  })

  if (!result.ok) {
    if (result.status === 429) return authFailureResponse(result)
    if (result.status >= 500) return authFailureResponse(result)

    if (result.status === 422) {
      const fieldErrors = withoutEmailErrors(result.fieldErrors)
      if (Object.keys(fieldErrors).length > 0) {
        return authFailureResponse({ ...result, fieldErrors })
      }
    }
  }

  // Anti-enumeration: never reveal whether the email already exists.
  return NextResponse.json(
    { success: true, message: NEUTRAL_MESSAGE, data: null },
    { status: 200 },
  )
}
