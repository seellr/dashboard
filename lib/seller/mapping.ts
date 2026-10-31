export type ProxyAccess = 'public' | 'subscriber'
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD'

export interface ProxyResolution {
  rule: string
  target: string
  access: ProxyAccess
}

interface ProxyRule {
  id: string
  methods: readonly HttpMethod[]
  pattern: RegExp
  access: ProxyAccess
  target: (match: RegExpMatchArray, segments: string[]) => string
}

const encodeSegments = (segments: string[]): string =>
  segments.map((segment) => encodeURIComponent(segment)).join('/')

/**
 * Explicit mapping table. Anything not matched here never reaches the backend.
 *
 * The important distinction:
 *   /api/subscriber/themes  -> backend /themes        (catalog)
 *   /api/subscriber/theme   -> backend /subscriber/theme
 */
const RULES: readonly ProxyRule[] = [
  {
    id: 'plans',
    methods: ['GET'],
    pattern: /^plans$/,
    access: 'public',
    target: () => '/plans',
  },
  {
    id: 'themes-list',
    methods: ['GET'],
    pattern: /^themes$/,
    access: 'public',
    target: () => '/themes',
  },
  {
    id: 'themes-detail',
    methods: ['GET'],
    pattern: /^themes\/([^/]+)$/,
    access: 'public',
    target: (match) => `/themes/${encodeURIComponent(match[1])}`,
  },
  {
    id: 'subscriber-theme',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    pattern: /^theme(?:\/.*)?$/,
    access: 'subscriber',
    target: (_match, segments) => `/subscriber/${encodeSegments(segments)}`,
  },
  {
    // TODO(backend): custom page create/rename/delete endpoints are not documented.
    id: 'subscriber-pages',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    pattern: /^pages(?:\/.*)?$/,
    access: 'subscriber',
    target: (_match, segments) => `/subscriber/${encodeSegments(segments)}`,
  },
  {
    id: 'tenant',
    methods: ['GET'],
    pattern: /^tenant$/,
    access: 'subscriber',
    target: () => '/subscriber/tenant',
  },
  {
    id: 'products',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    pattern: /^products(?:\/.*)?$/,
    access: 'subscriber',
    target: (_match, segments) => `/subscriber/${encodeSegments(segments)}`,
  },
  {
    id: 'media',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    pattern: /^media(?:\/.*)?$/,
    access: 'subscriber',
    target: (_match, segments) => `/subscriber/${encodeSegments(segments)}`,
  },
  {
    id: 'domains',
    methods: ['GET', 'POST', 'DELETE'],
    pattern: /^domains(?:\/.*)?$/,
    access: 'subscriber',
    target: (_match, segments) => `/subscriber/${encodeSegments(segments)}`,
  },
]

export function resolveProxyTarget(
  method: string,
  segments: string[],
): ProxyResolution | null {
  const path = segments.join('/')

  for (const rule of RULES) {
    if (!rule.methods.includes(method as HttpMethod)) continue
    const match = path.match(rule.pattern)
    if (!match) continue
    return {
      rule: rule.id,
      target: rule.target(match, segments),
      access: rule.access,
    }
  }

  return null
}
