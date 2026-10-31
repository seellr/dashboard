import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_API_URL, backendMultipartHeaders } from '@/lib/admin/backend-client'
import {
  authenticateAdminRequest,
  forwardToBackend,
  validationErrorResponse,
} from '@/lib/admin/server-media-proxy'
import {
  FOLDER_REGEX,
  MAX_MEDIA_FILE_SIZE,
  MediaSingleResponseSchema,
  isAllowedMediaFile,
} from '@/types/dto/media.dto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await authenticateAdminRequest(request)
  if (!auth.ok) return auth.response
  const { token, locale } = auth.ctx

  let formData: FormData
  try {
    formData = await request.formData()
  } catch (err) {
    console.error('[Media Upload] Failed to read multipart form data:', err)
    return validationErrorResponse(
      { file: ['Invalid multipart form data or request body too large.'] },
      'Could not read upload payload.',
    )
  }

  const file = formData.get('file')
  const errors: Record<string, string[]> = {}

  if (!file || !(file instanceof File)) {
    errors.file = ['The file field is required.']
  } else {
    if (file.size > MAX_MEDIA_FILE_SIZE) {
      errors.file = ['File size exceeds the 10MB limit.']
    }
    if (!isAllowedMediaFile(file.name, file.type)) {
      errors.file = [
        'Unsupported file type. Allowed: jpg, jpeg, png, gif, webp, svg, pdf, mp4, webm, zip, csv, xlsx, docx.',
      ]
    }
  }

  const folder = formData.get('folder')
  if (typeof folder === 'string' && folder.trim().length > 0) {
    if (folder.length > 200) {
      errors.folder = ['Folder name must not exceed 200 characters.']
    } else if (!FOLDER_REGEX.test(folder)) {
      errors.folder = [
        'Folder name may only contain letters, numbers, hyphens, underscores, and forward slashes.',
      ]
    }
  }

  const altText = formData.get('alt_text')
  if (typeof altText === 'string' && altText.length > 500) {
    errors.alt_text = ['Alt text must not exceed 500 characters.']
  }

  if (Object.keys(errors).length > 0) {
    return validationErrorResponse(errors)
  }

  const targetUrl = `${BACKEND_API_URL}/admin/media/upload`

  // Forward the FormData directly with backendMultipartHeaders
  const response = await forwardToBackend(targetUrl, {
    method: 'POST',
    headers: backendMultipartHeaders(locale, token),
    body: formData,
  })

  // Validate response shape on 201/200
  if (response.ok) {
    try {
      const clone = response.clone()
      const data = await clone.json()
      const parseResult = MediaSingleResponseSchema.safeParse(data)
      if (!parseResult.success) {
        console.error('[Media Upload] Upstream response validation failed:', parseResult.error.format())
        return NextResponse.json(
          {
            success: false,
            message: 'Upstream media upload contract mismatch',
            error_code: 'upstream_contract_error',
            errors: null,
          },
          { status: 502 },
        )
      }
    } catch (e) {
      console.error('[Media Upload] Failed to parse upload response:', e)
    }
  }

  return response
}
