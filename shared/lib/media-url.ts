/**
 * The backend returns media `url`/`thumb_url` values as paths relative to the
 * API host (e.g. `/storage/media/foo.png`). The dashboard and the preview
 * iframe run on a different origin, so a raw relative path resolves to the
 * dashboard host and 404s. This helper turns any stored media URL into an
 * absolute URL that works in the editor, the preview iframe and the
 * storefront.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1'

export const MEDIA_BASE_URL =
  process.env.NEXT_PUBLIC_STORAGE_URL
  ?? API_BASE.replace(/\/api\/v\d+\/?$/, '')

export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return ''
  const value = url.trim()
  if (!value) return ''
  // Already absolute (or a data/blob URL) — leave untouched.
  if (/^(https?:)?\/\//i.test(value) || /^(data|blob):/i.test(value)) return value
  return `${MEDIA_BASE_URL}${value.startsWith('/') ? '' : '/'}${value}`
}
