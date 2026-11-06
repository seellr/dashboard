import { getTranslations } from 'next-intl/server'
import { SellerThemeStringsClient } from '@/components/seller/store/SellerThemeStringsClient'

export default async function SellerThemeStringsPage() {
  const t = await getTranslations('seller.theme.strings')

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
      </div>
      <SellerThemeStringsClient />
    </div>
  )
}
