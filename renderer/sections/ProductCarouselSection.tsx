import type { Locale, SectionInstance } from '@/shared/types/builder'
import { ProductCarousel, type ProductCarouselItem } from '@/components/shared/product/ProductCarousel'
import { settingText } from '../section-utils'

const PLACEHOLDER_NAMES: Record<Locale, string[]> = {
  ar: ['دليل رقمي', 'حزمة قوالب', 'نظام Notion', 'حزمة برومبتات'],
  en: ['Digital guide', 'Template pack', 'Notion system', 'Prompt pack'],
}

const PLACEHOLDER_PRICES = ['29', '39', '49', '59']

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

function priceOf(value: unknown): string | number | null {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim()) return value
  return null
}

/**
 * Product settings arrive from the API either as fully hydrated product
 * objects or as bare ULIDs (the theme builder stores the latter). Hydrated
 * objects become real cards; bare IDs fall back to a skeleton card so the
 * section still previews the carousel layout inside the builder.
 */
function mapProduct(value: unknown, index: number, locale: Locale): ProductCarouselItem {
  const record = recordOf(value)
  const id =
    stringOf(record?.ulid) ??
    stringOf(record?.id) ??
    stringOf(value) ??
    `product-${index}`

  if (!record) {
    return {
      id,
      name: PLACEHOLDER_NAMES[locale][index % PLACEHOLDER_NAMES[locale].length],
      price: PLACEHOLDER_PRICES[index % PLACEHOLDER_PRICES.length],
      currency: 'USD',
      placeholder: true,
    }
  }

  const salePrice = priceOf(record.sale_price)
  const basePrice = priceOf(record.base_price ?? record.price)
  const isFeatured = record.featured === true

  return {
    id,
    name:
      localizedOf(record.name, locale) ??
      localizedOf(record.title, locale) ??
      stringOf(record.internal_name) ??
      PLACEHOLDER_NAMES[locale][index % PLACEHOLDER_NAMES[locale].length],
    href: stringOf(record.href) ?? undefined,
    imageUrl:
      stringOf(record.hero_image_url) ??
      stringOf(record.image_url) ??
      stringOf(record.image) ??
      null,
    price: salePrice ?? basePrice,
    compareAtPrice: salePrice ? basePrice : priceOf(record.compare_at_price),
    currency: stringOf(record.currency) ?? 'USD',
    badge: isFeatured ? (locale === 'ar' ? 'مميز' : 'Featured') : null,
    subtitle: localizedOf(record.type, locale) ?? undefined,
  }
}

function placeholderProducts(locale: Locale, count: number): ProductCarouselItem[] {
  return Array.from({ length: Math.min(Math.max(count, 1), 12) }, (_, index) => ({
    id: `placeholder-${index}`,
    name: PLACEHOLDER_NAMES[locale][index % PLACEHOLDER_NAMES[locale].length],
    price: PLACEHOLDER_PRICES[index % PLACEHOLDER_PRICES.length],
    currency: 'USD',
    placeholder: true,
  }))
}

export function ProductCarouselSection({ section, locale }: { section: SectionInstance; locale: Locale }) {
  const fallbackTitle = locale === 'ar' ? 'الأكثر طلبًا' : 'Popular right now'
  const titleKey = 'heading' in section.settings ? 'heading' : 'title'
  const descriptionKey = 'subheading' in section.settings ? 'subheading' : 'subtitle'
  const title = settingText(
    section.settings,
    titleKey,
    locale,
    settingText(section.settings, titleKey === 'heading' ? 'title' : 'heading', locale, fallbackTitle),
  )
  const description = settingText(
    section.settings,
    descriptionKey,
    locale,
    settingText(section.settings, descriptionKey === 'subheading' ? 'subtitle' : 'subheading', locale),
  )
  const eyebrow =
    settingText(section.settings, 'eyebrow', locale) ||
    (locale === 'ar' ? 'منتجات مختارة' : 'Selected collection')

  const rawProducts = Array.isArray(section.settings.products) ? section.settings.products : []
  const legacyCount = Number(section.settings.count ?? 4)
  const products =
    rawProducts.length > 0
      ? rawProducts.map((value, index) => mapProduct(value, index, locale))
      : placeholderProducts(locale, Number.isFinite(legacyCount) ? legacyCount : 4)

  const slidesPerView = Number(section.settings.slides_per_view ?? section.settings.columns ?? 4)
  const autoplayDelay = Number(section.settings.autoplay_delay ?? 4500)

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <ProductCarousel
        products={products}
        locale={locale}
        title={title}
        description={description || undefined}
        eyebrow={eyebrow}
        editableKeys={{ title: titleKey, description: descriptionKey, eyebrow: 'eyebrow' }}
        slidesPerView={Number.isFinite(slidesPerView) ? slidesPerView : 4}
        loop={section.settings.loop !== false}
        autoplay={section.settings.autoplay === true}
        autoplayDelay={Number.isFinite(autoplayDelay) ? autoplayDelay : 4500}
        showArrows={section.settings.show_arrows !== false}
        showDots={section.settings.show_dots === true}
        emptyLabel={locale === 'ar' ? 'لا توجد منتجات بعد.' : 'No products yet.'}
      />
    </section>
  )
}
