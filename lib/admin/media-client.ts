'use client'

import type { ApiMeta, ApiResult } from '@/lib/admin/api-server'
import type {
  MediaResource,
  UpdateMediaInput,
} from '@/types/dto/media.dto'

function getClientHeaders(): Record<string, string> {
  const locale = typeof document !== 'undefined' ? (document.documentElement.lang || 'en') : 'en'
  const brandId =
    typeof window !== 'undefined'
      ? (localStorage.getItem('admin_active_brand_id') ?? '1')
      : '1'

  return {
    'x-locale': locale,
    'x-brand-id': brandId,
    Accept: 'application/json',
  }
}

/**
 * Executes a multipart upload request via XMLHttpRequest for accurate upload progress and cancellation.
 */
function xhrUpload<T>(
  url: string,
  formData: FormData,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal,
): Promise<ApiResult<T>> {
  return new Promise((resolve) => {
    if (signal?.aborted) {
      resolve({
        ok: false,
        message: 'Upload aborted',
        errorCode: 'aborted',
        errors: null,
        status: 0,
      })
      return
    }

    const xhr = new XMLHttpRequest()
    xhr.open('POST', url)

    const headers = getClientHeaders()
    for (const [key, value] of Object.entries(headers)) {
      xhr.setRequestHeader(key, value)
    }
    // CRITICAL: Never set Content-Type header manually for FormData.
    // The browser automatically generates multipart boundary.

    if (onProgress && xhr.upload) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && event.total > 0) {
          const percent = Math.min(100, Math.round((event.loaded / event.total) * 100))
          onProgress(percent)
        }
      }
    }

    const abortHandler = () => {
      xhr.abort()
    }

    if (signal) {
      signal.addEventListener('abort', abortHandler, { once: true })
    }

    xhr.onload = () => {
      if (signal) {
        signal.removeEventListener('abort', abortHandler)
      }

      if (xhr.status === 204 || xhr.responseText.trim() === '') {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({
            ok: true,
            data: null as unknown as T,
          })
        } else {
          resolve({
            ok: false,
            message: xhr.statusText || `Request failed with status ${xhr.status}`,
            errorCode: `http_${xhr.status}`,
            errors: null,
            status: xhr.status,
          })
        }
        return
      }

      let json: Record<string, unknown> | null = null
      try {
        json = JSON.parse(xhr.responseText)
      } catch {
        resolve({
          ok: false,
          message: 'Failed to parse response from server',
          errorCode: 'parse_error',
          errors: null,
          status: xhr.status,
        })
        return
      }

      if (xhr.status >= 200 && xhr.status < 300 && json?.success !== false) {
        resolve({
          ok: true,
          data: (json?.data !== undefined ? json.data : json) as T,
          meta: (json?.meta as ApiMeta) ?? undefined,
        })
      } else {
        const message =
          (json?.message as string) ||
          (xhr.statusText || `Request failed with status ${xhr.status}`)
        const errorCode =
          (json?.error_code as string) || (xhr.status === 422 ? 'validation_failed' : `http_${xhr.status}`)
        const errors =
          (json?.errors as Record<string, string[]> | null) ?? null

        resolve({
          ok: false,
          message,
          errorCode,
          errors,
          status: xhr.status,
        })
      }
    }

    xhr.onerror = () => {
      if (signal) signal.removeEventListener('abort', abortHandler)
      resolve({
        ok: false,
        message: 'Network error occurred during upload',
        errorCode: 'network_error',
        errors: null,
        status: 0,
      })
    }

    xhr.onabort = () => {
      if (signal) signal.removeEventListener('abort', abortHandler)
      resolve({
        ok: false,
        message: 'Upload was canceled',
        errorCode: 'aborted',
        errors: null,
        status: 0,
      })
    }

    xhr.send(formData)
  })
}

/**
 * Executes a standard JSON fetch request with empty body support and error formatting.
 */
async function clientFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  try {
    const headers = {
      ...getClientHeaders(),
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers as Record<string, string> | undefined),
    }

    const res = await fetch(`/api/admin${path}`, {
      ...init,
      headers,
    })

    if (res.status === 204 || res.headers.get('content-length') === '0') {
      return { ok: true, data: null as unknown as T }
    }

    const text = await res.text()
    if (!text || text.trim() === '') {
      if (res.ok) {
        return { ok: true, data: null as unknown as T }
      }
      return {
        ok: false,
        message: `Request failed (${res.status})`,
        errorCode: `http_${res.status}`,
        errors: null,
        status: res.status,
      }
    }

    let json: Record<string, unknown> | null = null
    try {
      json = JSON.parse(text)
    } catch {
      return {
        ok: false,
        message: 'Failed to parse response JSON',
        errorCode: 'parse_error',
        errors: null,
        status: res.status,
      }
    }

    if (res.ok && json?.success !== false) {
      return {
        ok: true,
        data: (json?.data !== undefined ? json.data : json) as T,
        meta: (json?.meta as ApiMeta) ?? undefined,
      }
    }

    return {
      ok: false,
      message: (json?.message as string) || `Request failed (${res.status})`,
      errorCode: (json?.error_code as string) || (res.status === 422 ? 'validation_failed' : `http_${res.status}`),
      errors: (json?.errors as Record<string, string[]> | null) ?? null,
      status: res.status,
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return {
        ok: false,
        message: 'Request was canceled',
        errorCode: 'aborted',
        errors: null,
        status: 0,
      }
    }
    return {
      ok: false,
      message: 'Network error occurred',
      errorCode: 'network_error',
      errors: null,
      status: 0,
    }
  }
}

// ── Media Library Operations ────────────────────────────────────────────────

export interface UploadMediaOptions {
  folder?: string
  altText?: string
}

export async function uploadMedia(
  file: File,
  options?: UploadMediaOptions,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal,
): Promise<ApiResult<MediaResource>> {
  const formData = new FormData()
  formData.append('file', file)
  if (options?.folder) formData.append('folder', options.folder.trim())
  if (options?.altText) formData.append('alt_text', options.altText.trim())

  return xhrUpload<MediaResource>(
    '/api/admin/media/upload',
    formData,
    onProgress,
    signal,
  )
}

export async function uploadMediaMultiple(
  files: File[],
  options?: { folder?: string },
  onProgress?: (percent: number) => void,
  signal?: AbortSignal,
): Promise<ApiResult<MediaResource[]>> {
  const formData = new FormData()
  for (const file of files) {
    formData.append('files[]', file)
  }
  if (options?.folder) formData.append('folder', options.folder.trim())

  return xhrUpload<MediaResource[]>(
    '/api/admin/media/upload-multiple',
    formData,
    onProgress,
    signal,
  )
}

export interface ListMediaParams {
  search?: string
  folder?: string
  type?: string
  per_page?: number
  cursor?: string | null
}

export async function listMedia(
  params?: ListMediaParams,
): Promise<ApiResult<MediaResource[]>> {
  const qs = new URLSearchParams()
  if (params?.search) qs.set('search', params.search)
  if (params?.folder) qs.set('folder', params.folder)
  if (params?.type) qs.set('type', params.type)
  if (params?.per_page) qs.set('per_page', String(params.per_page))
  if (params?.cursor) qs.set('cursor', params.cursor)

  const query = qs.toString() ? `?${qs.toString()}` : ''
  return clientFetch<MediaResource[]>(`/media${query}`)
}

export async function getFolders(): Promise<ApiResult<string[]>> {
  return clientFetch<string[]>('/media/folders')
}

export async function getMedia(ulid: string): Promise<ApiResult<MediaResource>> {
  return clientFetch<MediaResource>(`/media/${encodeURIComponent(ulid)}`)
}

export async function updateMedia(
  ulid: string,
  data: UpdateMediaInput,
): Promise<ApiResult<MediaResource>> {
  return clientFetch<MediaResource>(`/media/${encodeURIComponent(ulid)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteMedia(ulid: string): Promise<ApiResult<null>> {
  return clientFetch<null>(`/media/${encodeURIComponent(ulid)}`, {
    method: 'DELETE',
  })
}

export async function bulkDeleteMedia(ulids: string[]): Promise<ApiResult<null>> {
  return clientFetch<null>('/media/bulk-delete', {
    method: 'POST',
    body: JSON.stringify({ ulids }),
  })
}

// ── Product Images Operations ───────────────────────────────────────────────

export async function uploadProductHeroImage(
  productUlid: string,
  imageFile: File,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal,
): Promise<ApiResult<unknown>> {
  const formData = new FormData()
  formData.append('image', imageFile)

  return xhrUpload<unknown>(
    `/api/admin/products/${encodeURIComponent(productUlid)}/hero-image`,
    formData,
    onProgress,
    signal,
  )
}

export async function uploadProductGalleryImage(
  productUlid: string,
  imageFile: File,
  altText?: string,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal,
): Promise<ApiResult<null>> {
  const formData = new FormData()
  formData.append('image', imageFile)
  if (altText) formData.append('alt_text', altText)

  return xhrUpload<null>(
    `/api/admin/products/${encodeURIComponent(productUlid)}/images`,
    formData,
    onProgress,
    signal,
  )
}

export async function deleteProductGalleryImage(
  productUlid: string,
  imageId: number | string,
): Promise<ApiResult<null>> {
  return clientFetch<null>(
    `/products/${encodeURIComponent(productUlid)}/images/${encodeURIComponent(String(imageId))}`,
    {
      method: 'DELETE',
    },
  )
}
