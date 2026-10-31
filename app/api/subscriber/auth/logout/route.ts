import { NextRequest, NextResponse } from 'next/server'
import {
  clearImpersonationCookie,
  clearSubscriberTokenCookie,
  getSubscriberToken,
} from '@/lib/seller/auth'
import { authLocale, callSubscriberAuth } from '@/lib/seller/auth-backend'

export async function POST(request: NextRequest) {
  const token = await getSubscriberToken()

  if (token) {
    await callSubscriberAuth('/subscriber/auth/logout', {
      method: 'POST',
      token,
      locale: authLocale(request),
    })
  }

  await clearSubscriberTokenCookie()
  await clearImpersonationCookie()

  return new NextResponse(null, { status: 204 })
}
