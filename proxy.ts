import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SUBSCRIBER_COOKIE_NAME } from '@/lib/seller/constants'
import {
  sanitizeSellerNext,
  sellerHome,
} from '@/lib/seller/next-path'

const SUPPORTED_LOCALES = new Set(['ar', 'en'])

const PUBLIC_SELLER_SEGMENTS = new Set([
  'login',
  'register',
  'check-email',
  'forgot-password',
  'reset-password',
  'verify-email',
])

const AUTH_ENTRY_SEGMENTS = new Set(['login', 'register'])

export function proxy(request: NextRequest) {
  const match = request.nextUrl.pathname.match(
    /^\/([a-z]{2})\/seller(?:\/(.*))?$/,
  )
  if (!match) return NextResponse.next()

  const locale = match[1]
  if (!SUPPORTED_LOCALES.has(locale)) return NextResponse.next()

  const segment = (match[2] ?? '').split('/')[0]
  const isPublic = PUBLIC_SELLER_SEGMENTS.has(segment)
  const token = request.cookies.get(SUBSCRIBER_COOKIE_NAME)?.value
  const expired = request.nextUrl.searchParams.get('expired') === '1'

  if (!token && !isPublic) {
    const loginUrl = new URL(`/${locale}/seller/login`, request.url)
    loginUrl.searchParams.set(
      'next',
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    )
    return NextResponse.redirect(loginUrl)
  }

  if (token && !expired && AUTH_ENTRY_SEGMENTS.has(segment)) {
    const next = sanitizeSellerNext(
      request.nextUrl.searchParams.get('next'),
      locale,
      sellerHome(locale),
    )
    return NextResponse.redirect(new URL(next, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/:locale/seller', '/:locale/seller/:path*'],
}
