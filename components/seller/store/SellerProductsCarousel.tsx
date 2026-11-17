'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'
import { ArrowRight, Plus } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import {
  ProductCarousel,
  type ProductCarouselItem,
} from '@/components/shared/product/ProductCarousel'
import {
  listSellerProducts,
  type SellerProduct,
} from '@/lib/seller/resource-client'
import type { Locale } from '@/shared/types/builder'

const STATUS_LABELS = ['Draft', 'Published', 'Archived', 'Coming Soon', 'Waitlist']

function enumLabel(value: SellerProduct['status']): string | null {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return STATUS_LABELS[value - 1] ?? String(value)
  if (value && typeof value === 'object') {
    return value.label ?? (typeof value.id === 'number' ? STATUS_LABELS[value.id - 1] ?? String(value.id) : String(value.id))
  }
  return null
}

function toCarouselItem(product: SellerProduct, locale: Locale, featuredLabel: string): ProductCarouselItem {
  return {
    id: product.ulid,
    name: product.name ?? product.internal_name ?? product.ulid,
    href: `/${locale}/seller/products/${product.ulid}`,
    imageUrl: product.hero_image_url,
    price: product.sale_price ?? product.base_price,
    compareAtPrice: product.sale_price ? product.base_price : null,
    currency: product.currency ?? 'USD',
    badge: product.featured ? featuredLabel : null,
    subtitle: enumLabel(product.status),
  }
}

const LOADING_ITEMS: ProductCarouselItem[] = Array.from({ length: 4 }, (_, index) => ({
  id: `loading-${index}`,
  name: '',
  currency: 'USD',
  placeholder: true,
}))

/**
 * Dashboard-side products carousel. It reuses the exact Embla carousel that
 * powers the storefront section, but links every card to the seller product
 * editor and shows the product's status as its subtitle.
 */
export function SellerProductsCarousel() {
  const t = useTranslations('seller.dashboard.carousel')
  const locale = useLocale() as Locale

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['seller-dashboard-products-carousel'],
    queryFn: async (): Promise<SellerProduct[]> => {
      const result = await listSellerProducts('?per_page=12')
      return result.ok ? result.data.items : []
    },
    staleTime: 60_000,
  })

  const items = isLoading
    ? LOADING_ITEMS
    : products.map((product) => toCarouselItem(product, locale, t('featured')))

  return (
    <section className="rounded-2xl border bg-card p-4 sm:p-6">
      <ProductCarousel
        products={items}
        locale={locale}
        title={t('title')}
        description={t('description')}
        eyebrow={t('eyebrow')}
        variant="dashboard"
        slidesPerView={4}
        loop={items.length > 1}
        showArrows={items.length > 1}
        showDots={false}
        emptyLabel={t('empty')}
        action={
          <div className="flex flex-wrap items-center gap-1.5">
            <Link
              href={`/${locale}/seller/products/new`}
              className={buttonVariants({ variant: 'outline', size: 'sm', className: 'gap-1.5' })}
            >
              <Plus className="size-3.5" aria-hidden="true" />
              {t('newProduct')}
            </Link>
            <Link
              href={`/${locale}/seller/products`}
              className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'gap-1.5' })}
            >
              {t('viewAll')}
              <ArrowRight className="size-3.5 rtl:rotate-180" aria-hidden="true" />
            </Link>
          </div>
        }
      />
    </section>
  )
}
