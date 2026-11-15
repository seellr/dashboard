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

/**
 * Hosts that only resolve on a developer machine. Settings saved while the
 * dashboard pointed at a local backend keep the old absolute URL, which 404s
 * as soon as `NEXT_PUBLIC_API_URL` moves to a remote/staging API.
 */
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '[::1]', '::1'])

function rebaseLoopbackStorageUrl(value: string): string | null {
  const absolute = value.startsWith('//') ? `http:${value}` : value
  try {
    const parsed = new URL(absolute)
    if (!LOOPBACK_HOSTS.has(parsed.hostname)) return null
    if (!parsed.pathname.startsWith('/storage/')) return null
    return `${MEDIA_BASE_URL}${parsed.pathname}${parsed.search}`
  } catch {
    return null
  }
}

export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return ''
  const value = url.trim()
  if (!value) return ''
  // Data/blob URLs are already renderable and have no host to rewrite.
  if (/^(data|blob):/i.test(value)) return value
  // Absolute URLs are left untouched, except for storage URLs saved against a
  // loopback backend (see LOOPBACK_HOSTS).
  if (/^(https?:)?\/\//i.test(value)) {
    return rebaseLoopbackStorageUrl(value) ?? value
  }
  return `${MEDIA_BASE_URL}${value.startsWith('/') ? '' : '/'}${value}`
}

/**
 * True when the backend serves this URL from its own `/storage` directory, so
 * a failed load means the file is missing on the server rather than a bad URL.
 */
export function isBackendStorageUrl(url: string | null | undefined): boolean {
  if (!url) return false
  const value = url.trim()
  return /(^|\/)storage\//i.test(value)
}
