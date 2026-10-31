import { getTranslations } from 'next-intl/server'
import { SellerDomainsClient } from '@/components/seller/store/SellerDomainsClient'

export default async function SellerDomainsPage() {
  const t = await getTranslations('seller.nav')
  return <div className="space-y-4"><h1 className="text-2xl font-semibold">{t('domains')}</h1><SellerDomainsClient /></div>
}
