import { getTranslations } from 'next-intl/server'
import { adminFetchServer } from '@/lib/admin/api-server'
import { LocalizationClient } from '@/components/admin/localization/LocalizationClient'

interface LocaleString {
  key: string
  value: string
  default_value: string | null
  overridden: boolean
}

export default async function AdminLocalizationPage() {
  const t = await getTranslations('admin')

  const [arResult, enResult] = await Promise.all([
    adminFetchServer<LocaleString[]>('/admin/brands/1/locale/ar/resolved'),
    adminFetchServer<LocaleString[]>('/admin/brands/1/locale/en/resolved'),
  ])

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">{t('nav.localization')}</h1>
      <LocalizationClient
        initialStrings={{
          ar: arResult.ok ? arResult.data : [],
          en: enResult.ok ? enResult.data : [],
        }}
      />
    </div>
  )
}
