import type { Locale, SectionInstance } from '@/shared/types/builder'
import { resolveMediaUrl } from '@/shared/lib/media-url'
import { editKey, settingText } from '../section-utils'

const GRID_BY_COLUMNS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 md:grid-cols-4',
  5: 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
  6: 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
}

const PLACEHOLDER_NAMES: Record<Locale, string[]> = {
  ar: ['دليل رقمي', 'حزمة قوالب', 'نظام Notion', 'حزمة برومبتات'],
  en: ['Digital guide', 'Template pack', 'Notion system', 'Prompt pack'],
}

interface PreviewProduct {
  id: string
  name: string
  imageUrl: string | null
  price: string | null
  currency: string
  placeholder: boolean
}

function recordOf(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function stringOf(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value
  if (typeof value === 'number') return String(value)
  return null
}

function localizedOf(value: unknown, locale: Locale): string | null {
  if (typeof value === 'string') return value
  const record = recordOf(value)
  if (!record) return null
  const text = record[locale]
  return typeof text === 'string' ? text : null
}

/**
 * The builder stores ULIDs in `products`, but hydrated product objects can also
 * arrive from the API. Show real names/images when available and a tidy card
 * skeleton for bare IDs so the chosen column count is always easy to judge.
 */
function mapProduct(value: unknown, index: number, locale: Locale): PreviewProduct {
  const record = recordOf(value)
  const names = PLACEHOLDER_NAMES[locale]
  const fallbackName = names[index % names.length]

  if (!record) {
    return {
      id: stringOf(value) ?? `product-${index}`,
      name: fallbackName,
      imageUrl: null,
      price: null,
      currency: 'USD',
      placeholder: true,
    }
  }

  const rawImage =
    stringOf(record.hero_image_url) ??
    stringOf(record.image_url) ??
    stringOf(record.image) ??
    null

  return {
    id: stringOf(record.ulid) ?? stringOf(record.id) ?? `product-${index}`,
    name:
      localizedOf(record.name, locale) ??
      localizedOf(record.title, locale) ??
      stringOf(record.internal_name) ??
      fallbackName,
    imageUrl: rawImage ? resolveMediaUrl(rawImage) : null,
    price:
      stringOf(record.sale_price) ??
      stringOf(record.base_price) ??
      stringOf(record.price),
    currency: stringOf(record.currency) ?? 'USD',
    placeholder: false,
  }
}

export function ProductGridSection({ section, locale }: { section: SectionInstance; locale: Locale }) {
  const headingKey = 'heading' in section.settings ? 'heading' : 'title'
  const title =
    headingKey === 'heading'
      ? settingText(section.settings, 'heading', locale)
      : settingText(section.settings, 'title', locale, locale === 'ar' ? 'منتجاتنا' : 'Featured products')
  const eyebrow = settingText(section.settings, 'eyebrow', locale, locale === 'ar' ? 'منتجات مختارة' : 'Selected collection')
  const badge = settingText(section.settings, 'badge', locale, locale === 'ar' ? 'مميز' : 'Featured')
  const columns = Math.min(6, Math.max(1, Number(section.settings.columns) || 3))
  const columnClass = GRID_BY_COLUMNS[columns]
  const rawProducts = Array.isArray(section.settings.products) ? section.settings.products : []
  const legacyCount = Number(section.settings.count ?? 0)
  const count = rawProducts.length > 0
    ? rawProducts.length
    : Math.max(1, Math.min(Number.isFinite(legacyCount) && legacyCount > 0 ? legacyCount : 3, 12))
  const products = rawProducts.length > 0
    ? rawProducts.map((value, index) => mapProduct(value, index, locale))
    : Array.from({ length: count }, (_, index) => mapProduct(null, index, locale))

  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="mb-10 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <span {...editKey('eyebrow')} className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            {eyebrow}
          </span>
          <h2 {...editKey(headingKey)} className="mt-3 text-3xl font-bold tracking-tight">
            {title}
          </h2>
        </div>
        <span className="hidden shrink-0 rounded-full border bg-muted/40 px-2.5 py-1 text-[11px] text-muted-foreground sm:inline-flex">
          {locale === 'ar' ? `${columns} أعمدة` : `${columns} column${columns === 1 ? '' : 's'}`}
        </span>
      </div>
      <div className={`grid gap-5 ${columnClass}`}>
        {products.map((product, index) => (
          <article
            key={`${product.id}-${index}`}
            className="group flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-primary/15 via-muted to-secondary">
              {product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 grid place-items-center text-4xl font-bold text-primary/20">
                  {String(index + 1).padStart(2, '0')}
                </div>
              )}
              {badge ? (
                <span
                  {...editKey('badge')}
                  className="absolute start-3 top-3 rounded-full bg-background/85 px-2.5 py-1 text-[11px] font-semibold backdrop-blur"
                >
                  {badge}
                </span>
              ) : null}
            </div>
            <div className="flex flex-1 flex-col gap-2 p-4">
              {product.placeholder ? (
                <div className="h-4 w-2/3 rounded bg-muted" />
              ) : (
                <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{product.name}</h3>
              )}
              <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/60 pt-3">
                {product.placeholder ? (
                  <>
                    <div className="h-3 w-1/3 rounded bg-muted" />
                    <div className="size-7 rounded-full bg-muted" />
                  </>
                ) : (
                  <>
                    <span className="text-sm font-bold">
                      {product.price ?? '—'} {product.currency}
                    </span>
                    <span className="grid size-7 place-items-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
