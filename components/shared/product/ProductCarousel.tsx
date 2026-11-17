import Link from 'next/link'
import { ImageIcon } from 'lucide-react'
import { EmblaCarousel } from '@/components/shared/carousel/EmblaCarousel'
import { resolveMediaUrl } from '@/shared/lib/media-url'
import { cn } from '@/lib/utils'

export interface ProductCarouselItem {
  id: string
  name: string
  href?: string
  imageUrl?: string | null
  price?: string | number | null
  compareAtPrice?: string | number | null
  currency?: string | null
  badge?: string | null
  subtitle?: string | null
  /** Renders neutral skeleton bars instead of product text. Used before products are chosen. */
  placeholder?: boolean
}

export interface ProductCarouselProps {
  products: ProductCarouselItem[]
  locale: 'ar' | 'en'
  title: string
  description?: string
  eyebrow?: string
  action?: React.ReactNode
  variant?: 'storefront' | 'dashboard'
  slidesPerView?: number
  loop?: boolean
  autoplay?: boolean
  autoplayDelay?: number
  showArrows?: boolean
  showDots?: boolean
  emptyLabel?: string
  className?: string
}

function formatPrice(
  value: ProductCarouselItem['price'],
  currency: string | null | undefined,
  locale: 'ar' | 'en',
): string | null {
  if (value === null || value === undefined || value === '') return null
  const number = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(number)) return `${value} ${currency ?? ''}`.trim()
  try {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar' : 'en', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 2,
    }).format(number)
  } catch {
    return `${number} ${currency ?? ''}`.trim()
  }
}

function ProductCard({
  product,
  locale,
  variant,
}: {
  product: ProductCarouselItem
  locale: 'ar' | 'en'
  variant: 'storefront' | 'dashboard'
}) {
  const imageUrl = resolveMediaUrl(product.imageUrl)
  const price = formatPrice(product.price, product.currency, locale)
  const compareAt = formatPrice(product.compareAtPrice, product.currency, locale)
  const isDashboard = variant === 'dashboard'

  const content = (
    <article
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all',
        isDashboard
          ? 'hover:border-primary/40 hover:shadow-md'
          : 'hover:-translate-y-1 hover:shadow-xl',
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-primary/15 via-muted to-secondary">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={product.name}
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 text-primary/30">
            <ImageIcon className="size-8" aria-hidden="true" />
            <span className="text-3xl font-bold">
              {product.name.slice(0, 1).toUpperCase()}
            </span>
          </div>
        )}
        {product.badge && (
          <span className="absolute start-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-semibold shadow-sm backdrop-blur">
            {product.badge}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {product.placeholder ? (
          <>
            <div className="h-4 w-3/4 rounded bg-muted" />
            <div className="mt-auto h-3 w-1/3 rounded bg-muted" />
          </>
        ) : (
          <>
            {product.subtitle && (
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {product.subtitle}
              </p>
            )}
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
              {product.name}
            </h3>
            {price && (
              <div className="mt-auto flex flex-wrap items-baseline gap-2">
                <span className="text-sm font-bold text-foreground">{price}</span>
                {compareAt && (
                  <span className="text-xs text-muted-foreground line-through">
                    {compareAt}
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </article>
  )

  if (!product.href || product.placeholder) return content

  if (/^https?:\/\//i.test(product.href)) {
    return (
      <a href={product.href} className="block h-full focus-visible:outline-none">
        {content}
      </a>
    )
  }

  return (
    <Link href={product.href} className="block h-full focus-visible:outline-none">
      {content}
    </Link>
  )
}

/**
 * Product carousel used by both the storefront renderer and the seller
 * dashboard. The two variants only differ in card motion/styling; the Embla
 * behaviour (drag, arrows, dots, RTL, autoplay) is identical.
 */
export function ProductCarousel({
  products,
  locale,
  title,
  description,
  eyebrow,
  action,
  variant = 'storefront',
  slidesPerView = 4,
  loop = true,
  autoplay = false,
  autoplayDelay,
  showArrows = true,
  showDots = false,
  emptyLabel,
  className,
}: ProductCarouselProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && (
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              {eyebrow}
            </span>
          )}
          <h2
            className={cn(
              'font-bold tracking-tight',
              eyebrow ? 'mt-3 text-3xl' : 'text-2xl',
            )}
          >
            {title}
          </h2>
          {description && (
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      {products.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          {emptyLabel ?? (locale === 'ar' ? 'لا توجد منتجات بعد.' : 'No products yet.')}
        </p>
      ) : (
        <EmblaCarousel
          label={title}
          slidesPerView={slidesPerView}
          loop={loop}
          autoplay={autoplay}
          autoplayDelay={autoplayDelay}
          showArrows={showArrows}
          showDots={showDots}
          rtl={locale === 'ar'}
          previousLabel={locale === 'ar' ? 'الشريحة السابقة' : 'Previous slide'}
          nextLabel={locale === 'ar' ? 'الشريحة التالية' : 'Next slide'}
          goToSlideLabel={(index) =>
            locale === 'ar' ? `الانتقال إلى الشريحة ${index + 1}` : `Go to slide ${index + 1}`
          }
        >
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              locale={locale}
              variant={variant}
            />
          ))}
        </EmblaCarousel>
      )}
    </div>
  )
}
