import { NextRequest, NextResponse } from 'next/server'
import { getAdminTokenCookie } from '@/lib/admin/auth'
import { BACKEND_API_URL } from '@/lib/admin/backend-client'
import { BACKEND_API_KEY } from '@/lib/admin/backend-client'

async function forward(request: NextRequest, path: string[]): Promise<NextResponse> {
  const token = await getAdminTokenCookie()

  if (!token) {
    return NextResponse.json({ success: false, message: 'Unauthenticated', error_code: 'unauthenticated' }, { status: 401 })
  }

  const locale = request.headers.get('x-locale') ?? 'en'
  const brandId = request.headers.get('x-brand-id') ?? '1'
  const search = request.nextUrl.search
  // Preserve a trailing slash on the forwarded URL: the locale overrides
  // endpoint (/admin/{scope}/{id}/locale/{locale}/) is defined with one.
  const hasTrailingSlash = request.nextUrl.pathname.endsWith('/')
  const targetUrl = `${BACKEND_API_URL}/admin/${path.join('/')}${hasTrailingSlash ? '/' : ''}${search}`
  if (process.env.NODE_ENV !== 'production') console.log(`[admin-proxy] ${request.method} ${targetUrl}`)

  const isMultipart = request.headers.get('content-type')?.includes('multipart/form-data')
  const isReadOnly = request.method === 'GET' || request.method === 'DELETE'

  let body: BodyInit | undefined
  const extraHeaders: Record<string, string> = {}

  if (!isReadOnly) {
    if (isMultipart) {
      body = await request.blob()
      extraHeaders['Content-Type'] = request.headers.get('content-type') ?? ''
    } else {
      body = await request.text()
    }
  }
  let res: Response
  try {
    res = await fetch(targetUrl, {
    method: request.method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'x-api-key': BACKEND_API_KEY,
      'Accept-Language': locale === 'ar' || locale === 'en' ? locale : 'en',
      'X-Brand-Id': brandId,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extraHeaders,
    },
    body,
    })
  } catch {
    return NextResponse.json({ success: false, message: 'Bad Gateway: backend connection failed', error_code: 'bad_gateway', errors: null }, { status: 502 })
  }

  if (res.status === 204) {
    return new NextResponse(null, { status: 204 })
  }

  const text = await res.text()
  if (!text.trim()) return new NextResponse(null, { status: res.status })
  let json: unknown
  try { json = JSON.parse(text) as unknown } catch { return NextResponse.json({ success: false, message: 'Invalid response from upstream server', error_code: 'upstream_invalid_json', errors: null }, { status: 502 }) }
  if (res.status === 401 && typeof json === 'object' && json !== null && 'message' in json && !('success' in json)) return NextResponse.json({ success: false, message: 'The admin service is unavailable. Please try again later.', error_code: 'service_misconfigured', errors: null }, { status: 502 })
  return NextResponse.json(json, { status: res.status })
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return forward(request, (await params).path)
}
export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return forward(request, (await params).path)
}
export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return forward(request, (await params).path)
}
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return forward(request, (await params).path)
}
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return forward(request, (await params).path)
}
