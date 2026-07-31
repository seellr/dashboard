import { getTranslations } from 'next-intl/server'
import { MediaLibraryClient } from '@/components/admin/media/MediaLibraryClient'

export default async function AdminMediaPage() {
  const t = await getTranslations('admin')
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">{t('nav.media')}</h1>
      <MediaLibraryClient />
    </div>
  )
}
