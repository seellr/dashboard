import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_API_URL, backendMultipartHeaders } from '@/lib/admin/backend-client'
import {
  authenticateAdminRequest,
  forwardToBackend,
  validationErrorResponse,
} from '@/lib/admin/server-media-proxy'
import {
  MAX_PRODUCT_IMAGE_SIZE,
  isAllowedProductImage,
} from '@/types/dto/media.dto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ ulid: string }>
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const auth = await authenticateAdminRequest(request)
  if (!auth.ok) return auth.response
  const { token, locale } = auth.ctx
  const { ulid } = await params

  let formData: FormData
  try {
    formData = await request.formData()
  } catch (err) {
    console.error('[Product Gallery Upload] Failed to read multipart form data:', err)
    return validationErrorResponse(
      { image: ['Invalid multipart form data.'] },
      'Could not read upload payload.',
    )
  }

  const image = formData.get('image')
  const errors: Record<string, string[]> = {}

  if (!image || !(image instanceof File)) {
    errors.image = ['The image field is required.']
  } else {
    if (image.size > MAX_PRODUCT_IMAGE_SIZE) {
      errors.image = ['Image size exceeds the 4MB limit.']
    }
    if (!isAllowedProductImage(image.name, image.type)) {
      errors.image = [
        'Unsupported image type. Allowed formats: png, jpg, jpeg, webp.',
      ]
    }
  }

  const altText = formData.get('alt_text')
  if (typeof altText === 'string' && altText.length > 255) {
    errors.alt_text = ['Alt text must not exceed 255 characters.']
  }

  if (Object.keys(errors).length > 0) {
    return validationErrorResponse(errors)
  }

  const targetUrl = `${BACKEND_API_URL}/admin/products/${ulid}/images`

  return forwardToBackend(targetUrl, {
    method: 'POST',
    headers: backendMultipartHeaders(locale, token),
    body: formData,
  })
}
