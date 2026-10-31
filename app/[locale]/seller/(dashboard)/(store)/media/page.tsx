import { getTranslations } from 'next-intl/server'
import { SellerMediaClient } from '@/components/seller/store/SellerMediaClient'

export default async function SellerMediaPage() {
  const t = await getTranslations('seller.nav')
  return <div className="space-y-4"><h1 className="text-2xl font-semibold">{t('media')}</h1><SellerMediaClient /></div>
}
