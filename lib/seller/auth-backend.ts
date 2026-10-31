import 'server-only'
import { NextResponse } from 'next/server'
import type { ZodType } from 'zod'
import type { ZodError } from 'zod'
import {
  BACKEND_API_URL,
  subscriberHeaders,
} from '@/lib/seller/backend-client'
import { normalizeEnvelope } from '@/lib/shared/api-envelope'
import type { AuthFieldErrors } from '@/types/dto/subscriber-auth.dto'

export interface SubscriberAuthSuccess {
  ok: true
  status: number
  data: unknown
  message?: string
}

export interface SubscriberAuthFailure {
  ok: false
  status: number
  errorCode: string
  message: string
  fieldErrors: AuthFieldErrors | null
}

export type SubscriberAuthResult = SubscriberAuthSuccess | SubscriberAuthFailure

export function authLocale(request: Request): 'ar' | 'en' {
  const header = request.headers.get('x-locale')
  if (header === 'ar' || header === 'en') return header

  const query = new URL(request.url).searchParams.get('locale')
  return query === 'en' ? 'en' : 'ar'
}

function isBareMessage(payload: unknown): boolean {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    !('success' in payload) &&
    'message' in payload
  )
}

function failure(
  status: number,
  errorCode: string,
  message: string,
  fieldErrors: AuthFieldErrors | null = null,
): SubscriberAuthFailure {
  return { ok: false, status, errorCode, message, fieldErrors }
}

/**
 * Server-only auth call. Always reads the body as text, never logs payloads,
 * and normalizes the bare 401 returned for a bad API key.
 */
export async function callSubscriberAuth(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT'
    body?: unknown
    token?: string | null
    locale: string
  },
): Promise<SubscriberAuthResult> {
  const method = options.method ?? 'POST'

  try {
    const response = await fetch(`${BACKEND_API_URL}${path}`, {
      method,
      headers: subscriberHeaders(options.locale, options.token),
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: 'no-store',
    })

    const text = await response.text()

    if (response.status === 204 || text.trim().length === 0) {
      if (response.ok) {
        return {
          ok: true,
          status: response.status,
          data: null,
        }
      }
      return failure(
        response.status,
        `http_${response.status}`,
        'Authentication request failed',
      )
    }

    let payload: unknown
    try {
      payload = JSON.parse(text) as unknown
    } catch {
      console.error('[seller-auth] Backend returned invalid JSON', {
        path,
        status: response.status,
      })
      return failure(502, 'bad_backend_shape', 'Unexpected response from server')
    }

    const envelope = normalizeEnvelope(payload, response.status)

    if (!response.ok || !envelope.success) {
      if (response.ok) {
        console.error('[seller-auth] Unexpected backend envelope', {
          path,
          status: response.status,
        })
        return failure(
          502,
          'bad_backend_shape',
          'Unexpected response from server',
        )
      }

      if (response.status === 401 && isBareMessage(payload)) {
        return failure(
          401,
          'auth_unavailable',
          'Authentication service is unavailable',
        )
      }

      return failure(
        response.status,
        envelope.error_code ?? 'request_failed',
        envelope.message ?? 'Authentication request failed',
        envelope.errors ?? null,
      )
    }

    return {
      ok: true,
      status: response.status,
      data: envelope.data ?? null,
      message: envelope.message,
    }
  } catch {
    console.error('[seller-auth] Backend connection failed', { path })
    return failure(
      502,
      'bad_gateway',
      'Could not reach the authentication service',
    )
  }
}

export function parseAuthData<T>(
  schema: ZodType<T>,
  result: SubscriberAuthSuccess,
  path: string,
): { ok: true; data: T } | SubscriberAuthFailure {
  const parsed = schema.safeParse(result.data)
  if (parsed.success) return { ok: true, data: parsed.data }

  console.error('[seller-auth] Unexpected backend shape', {
    path,
    issues: parsed.error.issues.map((issue) => issue.path.join('.')),
  })

  return failure(
    502,
    'bad_backend_shape',
    'Unexpected response from server',
  )
}

export function validationFailure(error: ZodError): SubscriberAuthFailure {
  const fieldErrors: AuthFieldErrors = {}

  for (const issue of error.issues) {
    const field = issue.path.join('.') || '_form'
    fieldErrors[field] = [...(fieldErrors[field] ?? []), issue.message]
  }

  return failure(422, 'validation_failed', 'Invalid request', fieldErrors)
}

export function authFailureResponse(result: SubscriberAuthFailure): NextResponse {
  return NextResponse.json(
    {
      success: false,
      message: result.message,
      error_code: result.errorCode,
      errors: result.fieldErrors,
    },
    { status: result.status },
  )
}
