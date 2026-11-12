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
  target: (match: RegExpMatchArray) => string
}

const ULID = '([A-Za-z0-9]{26})'
const ROW_ID = '([A-Za-z0-9_-]{1,64})'
const LOCALE = '(ar|en)'

const encode = (value: string): string => encodeURIComponent(value)

export const PROXY_RULES: readonly ProxyRule[] = [
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
    pattern: new RegExp(`^themes/${ULID}$`),
    access: 'public',
    target: (match) => `/themes/${encode(match[1])}`,
  },
  {
    id: 'tenant',
    methods: ['GET'],
    pattern: /^tenant$/,
    access: 'subscriber',
    target: () => '/subscriber/tenant',
  },
  {
    id: 'media-upload',
    methods: ['POST'],
    pattern: /^media\/upload$/,
    access: 'subscriber',
    target: () => '/subscriber/media/upload',
  },
  {
    id: 'media-upload-multiple',
    methods: ['POST'],
    pattern: /^media\/upload-multiple$/,
    access: 'subscriber',
    target: () => '/subscriber/media/upload-multiple',
  },
  {
    id: 'media-folders',
    methods: ['GET'],
    pattern: /^media\/folders$/,
    access: 'subscriber',
    target: () => '/subscriber/media/folders',
  },
  {
    id: 'media-bulk-delete',
    methods: ['POST'],
    pattern: /^media\/bulk-delete$/,
    access: 'subscriber',
    target: () => '/subscriber/media/bulk-delete',
  },
  {
    id: 'media-list',
    methods: ['GET'],
    pattern: /^media$/,
    access: 'subscriber',
    target: () => '/subscriber/media',
  },
  {
    id: 'media-detail',
    methods: ['GET', 'PUT', 'DELETE'],
    pattern: new RegExp(`^media/${ULID}$`),
    access: 'subscriber',
    target: (match) => `/subscriber/media/${encode(match[1])}`,
  },
  {
    id: 'products-list',
    methods: ['GET', 'POST'],
    pattern: /^products$/,
    access: 'subscriber',
    target: () => '/subscriber/products',
  },
  {
    id: 'product-hero-image',
    methods: ['POST'],
    pattern: new RegExp(`^products/${ULID}/hero-image$`),
    access: 'subscriber',
    target: (match) => `/subscriber/products/${encode(match[1])}/hero-image`,
  },
  {
    id: 'product-images',
    methods: ['POST'],
    pattern: new RegExp(`^products/${ULID}/images$`),
    access: 'subscriber',
    target: (match) => `/subscriber/products/${encode(match[1])}/images`,
  },
  {
    id: 'product-image-delete',
    methods: ['DELETE'],
    pattern: new RegExp(`^products/${ULID}/images/${ROW_ID}$`),
    access: 'subscriber',
    target: (match) => `/subscriber/products/${encode(match[1])}/images/${encode(match[2])}`,
  },
  {
    id: 'product-assets',
    methods: ['POST'],
    pattern: new RegExp(`^products/${ULID}/assets$`),
    access: 'subscriber',
    target: (match) => `/subscriber/products/${encode(match[1])}/assets`,
  },
  {
    id: 'product-asset-delete',
    methods: ['DELETE'],
    pattern: new RegExp(`^products/${ULID}/assets/${ROW_ID}$`),
    access: 'subscriber',
    target: (match) => `/subscriber/products/${encode(match[1])}/assets/${encode(match[2])}`,
  },
  {
    id: 'product-faqs',
    methods: ['POST'],
    pattern: new RegExp(`^products/${ULID}/faqs$`),
    access: 'subscriber',
    target: (match) => `/subscriber/products/${encode(match[1])}/faqs`,
  },
  {
    id: 'product-faq-delete',
    methods: ['DELETE'],
    pattern: new RegExp(`^products/${ULID}/faqs/${ROW_ID}$`),
    access: 'subscriber',
    target: (match) => `/subscriber/products/${encode(match[1])}/faqs/${encode(match[2])}`,
  },
  {
    id: 'product-testimonials',
    methods: ['POST'],
    pattern: new RegExp(`^products/${ULID}/testimonials$`),
    access: 'subscriber',
    target: (match) => `/subscriber/products/${encode(match[1])}/testimonials`,
  },
  {
    id: 'product-testimonial-delete',
    methods: ['DELETE'],
    pattern: new RegExp(`^products/${ULID}/testimonials/${ROW_ID}$`),
    access: 'subscriber',
    target: (match) => `/subscriber/products/${encode(match[1])}/testimonials/${encode(match[2])}`,
  },
  {
    id: 'product-bundle-items',
    methods: ['POST'],
    pattern: new RegExp(`^products/${ULID}/bundle-items$`),
    access: 'subscriber',
    target: (match) => `/subscriber/products/${encode(match[1])}/bundle-items`,
  },
  {
    id: 'product-bundle-item-delete',
    methods: ['DELETE'],
    pattern: new RegExp(`^products/${ULID}/bundle-items/${ULID}$`),
    access: 'subscriber',
    target: (match) => `/subscriber/products/${encode(match[1])}/bundle-items/${encode(match[2])}`,
  },
  {
    id: 'product-description',
    methods: ['PUT'],
    pattern: new RegExp(`^products/${ULID}/description$`),
    access: 'subscriber',
    target: (match) => `/subscriber/products/${encode(match[1])}/description`,
  },
  {
    id: 'product-seo',
    methods: ['PUT'],
    pattern: new RegExp(`^products/${ULID}/seo$`),
    access: 'subscriber',
    target: (match) => `/subscriber/products/${encode(match[1])}/seo`,
  },
  {
    id: 'product-delivery',
    methods: ['PUT'],
    pattern: new RegExp(`^products/${ULID}/delivery$`),
    access: 'subscriber',
    target: (match) => `/subscriber/products/${encode(match[1])}/delivery`,
  },
  {
    id: 'product-funnel',
    methods: ['PUT'],
    pattern: new RegExp(`^products/${ULID}/funnel$`),
    access: 'subscriber',
    target: (match) => `/subscriber/products/${encode(match[1])}/funnel`,
  },
  {
    id: 'product-detail',
    methods: ['GET', 'PUT', 'DELETE'],
    pattern: new RegExp(`^products/${ULID}$`),
    access: 'subscriber',
    target: (match) => `/subscriber/products/${encode(match[1])}`,
  },
  {
    id: 'domains-list',
    methods: ['GET', 'POST'],
    pattern: /^domains$/,
    access: 'subscriber',
    target: () => '/subscriber/domains',
  },
  {
    id: 'domain-verify',
    methods: ['POST'],
    pattern: new RegExp(`^domains/${ULID}/verify$`),
    access: 'subscriber',
    target: (match) => `/subscriber/domains/${encode(match[1])}/verify`,
  },
  {
    id: 'domain-primary',
    methods: ['POST'],
    pattern: new RegExp(`^domains/${ULID}/primary$`),
    access: 'subscriber',
    target: (match) => `/subscriber/domains/${encode(match[1])}/primary`,
  },
  {
    id: 'domain-delete',
    methods: ['DELETE'],
    pattern: new RegExp(`^domains/${ULID}$`),
    access: 'subscriber',
    target: (match) => `/subscriber/domains/${encode(match[1])}`,
  },
  {
    id: 'theme-active',
    methods: ['GET'],
    pattern: /^theme$/,
    access: 'subscriber',
    target: () => '/subscriber/theme',
  },
  {
    id: 'theme-activate',
    methods: ['POST'],
    pattern: /^theme\/activate$/,
    access: 'subscriber',
    target: () => '/subscriber/theme/activate',
  },
  {
    id: 'theme-settings',
    methods: ['GET', 'PUT'],
    pattern: /^theme\/settings$/,
    access: 'subscriber',
    target: () => '/subscriber/theme/settings',
  },
  {
    id: 'builder-theme-schema',
    methods: ['GET'],
    pattern: /^theme\/schema$/,
    access: 'subscriber',
    target: () => '/subscriber/theme/schema',
  },
  {
    id: 'builder-pages',
    methods: ['GET'],
    pattern: /^pages$/,
    access: 'subscriber',
    target: () => '/subscriber/pages',
  },
  {
    id: 'builder-page-draft',
    methods: ['GET', 'PUT'],
    pattern: new RegExp(`^pages/${ULID}/draft$`),
    access: 'subscriber',
    target: (match) => `/subscriber/pages/${encode(match[1])}/draft`,
  },
  {
    id: 'builder-preview-token',
    methods: ['POST'],
    pattern: /^theme\/preview-token$/,
    access: 'subscriber',
    target: () => '/subscriber/theme/preview-token',
  },
  {
    id: 'builder-publish',
    methods: ['POST'],
    pattern: /^theme\/publish$/,
    access: 'subscriber',
    target: () => '/subscriber/theme/publish',
  },
  {
    id: 'builder-discard',
    methods: ['POST'],
    pattern: /^theme\/discard$/,
    access: 'subscriber',
    target: () => '/subscriber/theme/discard',
  },
  {
    id: 'theme-locale-import',
    methods: ['POST'],
    pattern: new RegExp(`^theme/locale/${LOCALE}/import$`),
    access: 'subscriber',
    target: (match) => `/subscriber/theme/locale/${encode(match[1])}/import`,
  },
  {
    id: 'theme-locale-strings',
    methods: ['GET'],
    pattern: new RegExp(`^theme/locale/${LOCALE}$`),
    access: 'subscriber',
    target: (match) => `/subscriber/theme/locale/${encode(match[1])}`,
  },
  {
    id: 'theme-locale-key',
    methods: ['PUT', 'DELETE'],
    pattern: new RegExp(`^theme/locale/${LOCALE}/([^/]+)$`),
    access: 'subscriber',
    target: (match) =>
      `/subscriber/theme/locale/${encode(match[1])}/${encode(decodeURIComponent(match[2]))}`,
  },
]

export function resolveProxyTarget(
  method: string,
  segments: string[],
): ProxyResolution | null {
  const path = segments.join('/')

  for (const rule of PROXY_RULES) {
    if (!rule.methods.includes(method as HttpMethod)) continue
    const match = path.match(rule.pattern)
    if (!match) continue
    return {
      rule: rule.id,
      target: rule.target(match),
      access: rule.access,
    }
  }

  return null
}
