import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { BACKEND_API_URL, backendMultipartHeaders } from '@/lib/admin/backend-client'
import {
  authenticateAdminRequest,
  forwardToBackend,
  validationErrorResponse,
} from '@/lib/admin/server-media-proxy'
import {
  FOLDER_REGEX,
  MAX_MEDIA_BATCH_COUNT,
  MAX_MEDIA_FILE_SIZE,
  MediaResourceSchema,
  isAllowedMediaFile,
} from '@/types/dto/media.dto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MultipleUploadResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(MediaResourceSchema),
  message: z.string().optional(),
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await authenticateAdminRequest(request)
  if (!auth.ok) return auth.response
  const { token, locale } = auth.ctx

  let formData: FormData
  try {
    formData = await request.formData()
  } catch (err) {
    console.error('[Multiple Upload] Failed to read multipart form data:', err)
    return validationErrorResponse(
      { files: ['Invalid multipart form data or payload too large.'] },
      'Could not read upload payload.',
    )
  }

  // Check both 'files[]' and 'files'
  let rawFiles = formData.getAll('files[]')
  if (rawFiles.length === 0) {
    rawFiles = formData.getAll('files')
  }

  const files = rawFiles.filter((f): f is File => f instanceof File)
  const errors: Record<string, string[]> = {}

  if (files.length === 0) {
    errors.files = ['At least one file is required.']
  } else if (files.length > MAX_MEDIA_BATCH_COUNT) {
    errors.files = [
      `Cannot upload more than ${MAX_MEDIA_BATCH_COUNT} files at once. You provided ${files.length}.`,
    ]
  } else {
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.size > MAX_MEDIA_FILE_SIZE) {
        errors[`files[${i}]`] = [
          `"${file.name}" exceeds the 10MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB).`,
        ]
      }
      if (!isAllowedMediaFile(file.name, file.type)) {
        errors[`files[${i}]`] = [
          `"${file.name}" has an unsupported file type. Allowed: jpg, jpeg, png, gif, webp, svg, pdf, mp4, webm, zip, csv, xlsx, docx.`,
        ]
      }
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

  if (Object.keys(errors).length > 0) {
    return validationErrorResponse(errors)
  }

  // Ensure formData has 'files[]' key for the backend
  const backendFormData = new FormData()
  for (const file of files) {
    backendFormData.append('files[]', file)
  }
  if (typeof folder === 'string' && folder.trim().length > 0) {
    backendFormData.append('folder', folder.trim())
  }

  const targetUrl = `${BACKEND_API_URL}/admin/media/upload-multiple`

  const response = await forwardToBackend(targetUrl, {
    method: 'POST',
    headers: backendMultipartHeaders(locale, token),
    body: backendFormData,
  })

  // Validate response shape on 201/200
  if (response.ok) {
    try {
      const clone = response.clone()
      const data = await clone.json()
      const parseResult = MultipleUploadResponseSchema.safeParse(data)
      if (!parseResult.success) {
        console.error('[Multiple Upload] Contract validation failed:', parseResult.error.format())
        return NextResponse.json(
          {
            success: false,
            message: 'Upstream multiple upload contract mismatch',
            error_code: 'upstream_contract_error',
            errors: null,
          },
          { status: 502 },
        )
      }
    } catch (e) {
      console.error('[Multiple Upload] Failed to parse response:', e)
    }
  }

  return response
}
