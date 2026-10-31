import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { ThemeCatalog } from '@/builder/components/ThemeCatalog'
import { buttonVariants } from '@/components/ui/button'

export default async function SellerThemePage() {
  const t = await getTranslations('seller.nav')
  return <div className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-semibold">{t('theme')}</h1><Link className={buttonVariants()} href="../seller/theme-builder/editor">Open builder</Link></div><ThemeCatalog /></div>
}
