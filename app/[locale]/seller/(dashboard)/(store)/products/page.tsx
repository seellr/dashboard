import { getTranslations } from 'next-intl/server'
import { SellerProductsClient } from '@/components/seller/store/SellerProductsClient'

export default async function SellerProductsPage() {
  const t = await getTranslations('seller.nav')
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t('products')}</h1>
      <SellerProductsClient />
    </div>
  )
}
