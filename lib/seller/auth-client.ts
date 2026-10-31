'use client'

import type { FieldValues, Path, UseFormReturn } from 'react-hook-form'
import { normalizeEnvelope } from '@/lib/shared/api-envelope'
import type {
  AuthFieldErrors,
  ForgotPassword,
  LoginRequest,
  RegisterRequest,
  ResetPassword,
  SubscriberUser,
} from '@/types/dto/subscriber-auth.dto'

export type SellerAuthResult<T> =
  | { ok: true; data: T }
  | {
      ok: false
      status: number
      errorCode: string
      message?: string
      fieldErrors?: AuthFieldErrors | null
    }

function browserLocale(): 'ar' | 'en' {
  if (typeof document === 'undefined') return 'ar'
  return document.documentElement.lang === 'en' ? 'en' : 'ar'
}

function failure(
  status: number,
  errorCode: string,
  message?: string,
  fieldErrors?: AuthFieldErrors | null,
): SellerAuthResult<never> {
  return { ok: false, status, errorCode, message, fieldErrors }
}

async function request<T>(
  path: string,
  init: RequestInit,
): Promise<SellerAuthResult<T>> {
  try {
    const response = await fetch(`/api/subscriber/auth${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        'x-locale': browserLocale(),
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(init.headers as Record<string, string> | undefined),
      },
    })

    const text = await response.text()

    if (response.status === 204 || text.trim().length === 0) {
      if (response.ok) return { ok: true, data: null as T }
      return failure(response.status, `http_${response.status}`)
    }

    let payload: unknown
    try {
      payload = JSON.parse(text) as unknown
    } catch {
      return failure(502, 'bad_backend_shape')
    }

    const envelope = normalizeEnvelope(payload, response.status)
    if (!response.ok || !envelope.success) {
      return failure(
        response.status,
        envelope.error_code ?? 'request_failed',
        envelope.message,
        envelope.errors ?? null,
      )
    }

    return { ok: true, data: (envelope.data ?? null) as T }
  } catch {
    return failure(0, 'network_error')
  }
}

export function loginSeller(
  values: LoginRequest,
): Promise<SellerAuthResult<{ user: SubscriberUser }>> {
  return request('/login', {
    method: 'POST',
    body: JSON.stringify(values),
  })
}

export function registerSeller(
  values: RegisterRequest,
): Promise<SellerAuthResult<null>> {
  return request('/register', {
    method: 'POST',
    body: JSON.stringify(values),
  })
}

export function forgotSellerPassword(
  values: ForgotPassword,
): Promise<SellerAuthResult<null>> {
  return request('/password/forgot', {
    method: 'POST',
    body: JSON.stringify(values),
  })
}

export function resetSellerPassword(
  values: ResetPassword,
): Promise<SellerAuthResult<null>> {
  return request('/password/reset', {
    method: 'POST',
    body: JSON.stringify(values),
  })
}

export function logoutSeller(): Promise<SellerAuthResult<null>> {
  return request('/logout', { method: 'POST' })
}

export function getSellerMe(): Promise<
  SellerAuthResult<{ user: SubscriberUser }>
> {
  return request('/me', { method: 'GET' })
}

export function verifySellerEmail(
  ulid: string,
  hash: string,
): Promise<SellerAuthResult<null>> {
  const query = new URLSearchParams({ ulid, hash })
  return request(`/verify-email?${query.toString()}`, { method: 'GET' })
}

export function applyAuthFieldErrors<T extends FieldValues>(
  form: UseFormReturn<T>,
  fieldErrors: AuthFieldErrors | null | undefined,
  allowedFields: readonly Path<T>[],
  translate: (key: string) => string,
): boolean {
  if (!fieldErrors) return false

  let firstInvalid: Path<T> | null = null

  for (const [field, messages] of Object.entries(fieldErrors)) {
    const exact = allowedFields.find((allowed) => allowed === field)
    const lastSegment = field.split('.').pop()
    const path =
      exact ??
      (lastSegment
        ? allowedFields.find((allowed) => allowed === lastSegment)
        : undefined)
    const message = messages?.[0]
    if (!path || !message) continue

    form.setError(
      path,
      { type: 'server', message: translate(message) },
      { shouldFocus: false },
    )
    if (!firstInvalid) firstInvalid = path
  }

  if (firstInvalid) {
    const path = firstInvalid
    requestAnimationFrame(() => {
      try {
        form.setFocus(path)
      } catch {
        // Field may not be mounted (for example a hidden token field).
      }
    })
  }

  return firstInvalid !== null
}
