import { NextRequest } from 'next/server'
import { forwardSubscriberRequest } from '@/lib/seller/proxy'

type RouteContext = { params: Promise<{ path: string[] }> }

export async function GET(request: NextRequest, context: RouteContext) {
  return forwardSubscriberRequest(request, (await context.params).path)
}

export async function POST(request: NextRequest, context: RouteContext) {
  return forwardSubscriberRequest(request, (await context.params).path)
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return forwardSubscriberRequest(request, (await context.params).path)
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return forwardSubscriberRequest(request, (await context.params).path)
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return forwardSubscriberRequest(request, (await context.params).path)
}
