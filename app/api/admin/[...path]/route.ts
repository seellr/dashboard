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
  const targetUrl = `${BACKEND_API_URL}/admin/${path.join('/')}${search}`
  console.log('Target URL:', targetUrl);

  const isMultipart = request.headers.get('content-type')?.includes('multipart/form-data')
  const isReadOnly = request.method === 'GET' || request.method === 'DELETE'

  let body: BodyInit | undefined
  let extraHeaders: Record<string, string> = {}

  if (!isReadOnly) {
    if (isMultipart) {
      body = await request.blob()
      extraHeaders['Content-Type'] = request.headers.get('content-type') ?? ''
    } else {
      body = await request.text()
    }
  }
  const res = await fetch(targetUrl, {
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

  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return NextResponse.json({ success: true, data: null }, { status: 200 })
  }

  const json = await res.json().catch(() => ({ success: false, message: 'Parse error', error_code: 'parse_error' }))
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
