import 'server-only'
import { cookies } from 'next/headers'
import {
  SUBSCRIBER_COOKIE_NAME,
  SUBSCRIBER_IMPERSONATION_COOKIE_NAME,
} from '@/lib/seller/constants'

export interface ImpersonationMetadata {
  session_ulid: string
  name: string
}

export async function setSubscriberTokenCookie(
  token: string,
  expiresInSeconds: number,
): Promise<void> {
  const store = await cookies()
  store.set(SUBSCRIBER_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: expiresInSeconds,
  })
}

export async function getSubscriberToken(): Promise<string | null> {
  const store = await cookies()
  return store.get(SUBSCRIBER_COOKIE_NAME)?.value ?? null
}

export async function clearSubscriberTokenCookie(): Promise<void> {
  const store = await cookies()
  store.delete(SUBSCRIBER_COOKIE_NAME)
}

export async function setImpersonationCookie(
  metadata: ImpersonationMetadata,
  expiresInSeconds: number,
): Promise<void> {
  const store = await cookies()
  store.set(SUBSCRIBER_IMPERSONATION_COOKIE_NAME, JSON.stringify(metadata), {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: expiresInSeconds,
  })
}

export async function getImpersonationCookie(): Promise<ImpersonationMetadata | null> {
  const store = await cookies()
  const raw = store.get(SUBSCRIBER_IMPERSONATION_COOKIE_NAME)?.value
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'session_ulid' in parsed &&
      'name' in parsed &&
      typeof (parsed as { session_ulid?: unknown }).session_ulid === 'string' &&
      typeof (parsed as { name?: unknown }).name === 'string'
    ) {
      return {
        session_ulid: (parsed as { session_ulid: string }).session_ulid,
        name: (parsed as { name: string }).name,
      }
    }
    return null
  } catch {
    return null
  }
}

export async function clearImpersonationCookie(): Promise<void> {
  const store = await cookies()
  store.delete(SUBSCRIBER_IMPERSONATION_COOKIE_NAME)
}
