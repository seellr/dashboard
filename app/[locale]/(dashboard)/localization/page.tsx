import { getTranslations } from 'next-intl/server'
import { LocalizationClient } from '@/components/admin/localization/LocalizationClient'

export default async function AdminLocalizationPage() {
  const t = await getTranslations('admin')

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">{t('nav.localization')}</h1>
      <LocalizationClient />
    </div>
  )
}