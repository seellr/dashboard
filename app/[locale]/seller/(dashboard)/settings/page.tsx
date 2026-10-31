import { getTranslations } from 'next-intl/server'
import { SellerSettingsClient } from '@/components/seller/account/SellerSettingsClient'

export default async function SellerSettingsPage() {
  const t = await getTranslations('seller.nav')
  return <div className="space-y-4"><h1 className="text-2xl font-semibold">{t('settings')}</h1><SellerSettingsClient /></div>
}
