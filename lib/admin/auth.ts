import 'server-only'
import { cookies } from 'next/headers'

const COOKIE_NAME = 'token_admin'

export async function setAdminTokenCookie(token: string, expiresInSeconds: number): Promise<void> {
  const store = await cookies()
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: expiresInSeconds,
  })
}

export async function getAdminTokenCookie(): Promise<string | null> {
  const store = await cookies()
  return store.get(COOKIE_NAME)?.value ?? null
}

export async function clearAdminTokenCookie(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}
