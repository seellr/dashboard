const SAFE_ORIGIN = 'http://seller.local'

const AUTH_SEGMENTS = new Set([
  'login',
  'register',
  'check-email',
  'forgot-password',
  'reset-password',
  'verify-email',
])

export function sellerHome(locale: string): string {
  return `/${locale}/seller`
}

/**
 * Only relative seller paths are accepted. Both `/seller/...` and
 * `/{locale}/seller/...` are normalized to the locale-prefixed form so the
 * `next` parameter can never become an open redirect.
 */
export function sanitizeSellerNext(
  raw: string | null | undefined,
  locale: string,
  fallback: string = sellerHome(locale),
): string {
  if (!raw) return fallback

  const candidate = raw.trim()
  if (
    candidate.length === 0 ||
    candidate.startsWith('//') ||
    candidate.includes('\\') ||
    /%5c/i.test(candidate) ||
    /[\r\n]/.test(candidate)
  ) {
    return fallback
  }

  let normalized = candidate
  if (candidate.startsWith('/seller')) {
    normalized = `/${locale}${candidate}`
  } else if (!candidate.startsWith(`/${locale}/seller`)) {
    return fallback
  }

  let url: URL
  try {
    url = new URL(normalized, SAFE_ORIGIN)
  } catch {
    return fallback
  }

  if (url.origin !== SAFE_ORIGIN) return fallback
  if (url.pathname.startsWith('//') || url.pathname.includes('\\')) {
    return fallback
  }
  if (
    url.pathname !== `/${locale}/seller` &&
    !url.pathname.startsWith(`/${locale}/seller/`)
  ) {
    return fallback
  }

  const section = url.pathname
    .slice(`/${locale}/seller`.length)
    .split('/')
    .filter(Boolean)[0]
  if (section && AUTH_SEGMENTS.has(section)) return fallback

  return `${url.pathname}${url.search}${url.hash}`
}
