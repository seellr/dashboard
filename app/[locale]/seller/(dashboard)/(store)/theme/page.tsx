import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { SellerThemeClient } from '@/components/seller/store/SellerThemeClient'

export default async function SellerThemePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations('seller.nav')

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t('theme')}</h1>
        <div className="flex flex-wrap gap-2">
          <Link
            className={buttonVariants({ variant: 'outline' })}
            href={`/${locale}/seller/theme/strings`}
          >
            {t('strings')}
          </Link>
          <Link
            className={buttonVariants()}
            href={`/${locale}/seller/theme-builder/editor`}
          >
            Open builder
          </Link>
        </div>
      </div>
      <SellerThemeClient />
    </div>
  )
}
