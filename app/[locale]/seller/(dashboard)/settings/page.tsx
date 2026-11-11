import { getTranslations } from 'next-intl/server'
import { SellerSettingsClient } from '@/components/seller/account/SellerSettingsClient'

export default async function SellerSettingsPage() {
  const t = await getTranslations('seller.settings')
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
      </div>
      <SellerSettingsClient />
    </div>
  )
}
