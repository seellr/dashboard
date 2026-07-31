import { getTranslations } from 'next-intl/server'
import { adminFetchServer } from '@/lib/admin/api-server'
import { ProfileClient } from '@/components/admin/profile/ProfileClient'
import type { Admin } from '@/types/dto/auth.dto'

export default async function AdminProfilePage() {
  const t = await getTranslations('admin')

  const result = await adminFetchServer<Admin>('/admin/auth/me')
  if (!result.ok) {
    return (
      <div className="flex flex-col gap-6 max-w-xl">
        <h1 className="text-xl font-semibold">{t('profile.title')}</h1>
        <p className="text-sm text-destructive">Could not load profile</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <h1 className="text-xl font-semibold">{t('profile.title')}</h1>
      <ProfileClient admin={result.data} />
    </div>
  )
}
