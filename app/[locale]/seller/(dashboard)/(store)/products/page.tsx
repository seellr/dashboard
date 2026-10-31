import { getTranslations } from 'next-intl/server'
import { SellerProductWorkspace } from '@/components/seller/store/SellerProductWorkspace'

export default async function SellerProductsPage() {
  const t = await getTranslations('seller.nav')
  return <div className="space-y-4"><h1 className="text-2xl font-semibold">{t('products')}</h1><SellerProductWorkspace /></div>
}
