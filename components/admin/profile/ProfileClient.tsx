'use client'

import { useTranslations } from 'next-intl'
import type { Admin } from '@/types/dto/auth.dto'

interface Props {
  admin: Admin
}

export function ProfileClient({ admin }: Props) {
  const t = useTranslations('admin')

  const rows: [string, string][] = [
    [t('profile.firstName'), admin.first_name],
    [t('profile.lastName'), admin.last_name],
    [t('profile.email'), admin.email],
    [t('profile.role'), admin.is_super_admin ? t('profile.superAdmin') : (admin.roles ?? []).join(', ') || '—'],
    [t('profile.status'), admin.status === 1 ? t('profile.active') : String(admin.status ?? '—')],
  ]

  return (
    <dl className="flex flex-col gap-3">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between border-b pb-2">
          <dt className="text-sm text-muted-foreground">{label}</dt>
          <dd className="text-sm font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
