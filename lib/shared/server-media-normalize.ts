import 'server-only'

/**
 * Backend media responses use storage-relative paths such as
 * `/storage/media/file.png`. The dashboard and preview run on another origin,
 * so those paths 404 unless they are rewritten to the backend origin before
 * they reach the browser.
 */
export const MEDIA_URL_KEYS = [
  'url',
  'thumb_url',
  'hero_image_url',
  'image_url',
  'logo_url',
  'logo_image_url',
  'favicon_url',
  'avatar_url',
  'preview_url',
  'background_image',
  'background_image_url',
] as const

/**
 * Same as `MEDIA_URL_KEYS` minus the generic `url` key. Use this for payloads
 * that also carry builder link settings, where `url` is a route rather than a
 * storage path.
 */
export const MEDIA_URL_KEYS_WITHOUT_GENERIC = MEDIA_URL_KEYS.filter(
  (key) => key !== 'url',
)

export interface NormalizeMediaUrlsOptions {
  /** Origin to prepend, e.g. `http://localhost:8000`. */
  origin: string
  /** Restrict rewriting to a subset of keys. Defaults to all media keys. */
  keys?: readonly string[]
}

export function normalizeMediaUrls<T>(
  payload: T,
  { origin, keys = MEDIA_URL_KEYS }: NormalizeMediaUrlsOptions,
): T {
  const allowed = new Set(keys)

  const visit = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(visit)
    if (!value || typeof value !== 'object') return value

    const output: Record<string, unknown> = {}
    for (const [key, nested] of Object.entries(value)) {
      if (allowed.has(key) && typeof nested === 'string' && nested.startsWith('/')) {
        output[key] = `${origin}${nested}`
      } else {
        output[key] = visit(nested)
      }
    }
    return output
  }

  return visit(payload) as T
}
