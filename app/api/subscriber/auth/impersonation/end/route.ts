import { NextRequest, NextResponse } from 'next/server'
import {
  clearImpersonationCookie,
  clearSubscriberTokenCookie,
  getImpersonationCookie,
} from '@/lib/seller/auth'
import { endImpersonation } from '@/lib/seller/impersonation-backend'
import { authLocale } from '@/lib/seller/auth-backend'

export async function POST(request: NextRequest) {
  const metadata = await getImpersonationCookie()

  if (metadata) {
    await endImpersonation(metadata.session_ulid, authLocale(request))
  }

  await clearSubscriberTokenCookie()
  await clearImpersonationCookie()

  return new NextResponse(null, { status: 204 })
}
