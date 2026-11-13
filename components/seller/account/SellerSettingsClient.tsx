'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MediaPickerDialog } from '@/components/shared/media/MediaPickerDialog'
import {
  getSellerAccount,
  updateSellerAvatar,
  type SellerMedia,
} from '@/lib/seller/resource-client'

interface SellerAccount {
  name?: string | null
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  phone?: string | null
  avatar_url?: string | null
  plan_status?: number | { id: number; label: string } | null
  email_verified?: boolean
}

function pickUser(value: unknown): SellerAccount | null {
  if (!value || typeof value !== 'object') return null
  if ('user' in value) {
    const user = (value as { user?: unknown }).user
    return user && typeof user === 'object' ? (user as SellerAccount) : null
  }
  return value as SellerAccount
}

export function SellerSettingsClient() {
  const t = useTranslations('seller.settings')
  const locale = useLocale()
  const [account, setAccount] = useState<SellerAccount | null>(null)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void getSellerAccount().then((result) => {
        if (result.ok) setAccount(pickUser(result.data))
        else setMessage(result.message)
      })
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  const updateAvatar = async (media: SellerMedia) => {
    setSaving(true)
    setMessage('')
    const result = await updateSellerAvatar(media.ulid)
    setSaving(false)
    if (!result.ok) {
      setMessage(result.message)
      return
    }
    setAccount((current) =>
      current ? { ...current, avatar_url: media.thumb_url ?? media.url ?? null } : current,
    )
    setMessage(t('avatarUpdated'))
  }

  const logout = async () => {
    try {
      await fetch('/api/subscriber/auth/logout', {
        method: 'POST',
        headers: { 'x-locale': locale },
      })
    } finally {
      window.location.assign(`/${locale}/seller/login`)
    }
  }

  if (message && !account) {
    return (
      <p role="alert" className="text-sm text-destructive">
        {message}
      </p>
    )
  }

  if (!account) {
    return <p className="text-sm text-muted-foreground">{t('loading')}</p>
  }

  const name =
    [account.first_name, account.last_name].filter(Boolean).join(' ') || account.name || '—'

  return (
    <div className="max-w-xl space-y-5 rounded-lg border p-5">
      <div className="flex items-center gap-4">
        <Avatar className="size-14">
          {account.avatar_url && (
            <AvatarImage src={account.avatar_url} alt={name} />
          )}
          <AvatarFallback>{name.slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-semibold">{name}</h2>
          <p className="truncate text-sm text-muted-foreground">{account.email ?? '—'}</p>
        </div>
        <MediaPickerDialog
          accept="image/*"
          triggerLabel={t('changeAvatar')}
          onSelect={(media) => void updateAvatar(media)}
        />
      </div>

      {saving && <p className="text-sm text-muted-foreground">{t('saving')}</p>}
      {message && (
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
      )}

      <dl className="grid gap-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="font-medium">{t('phone')}</dt>
          <dd className="text-muted-foreground">{account.phone ?? '—'}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="font-medium">{t('emailVerification')}</dt>
          <dd className="text-muted-foreground">
            {account.email_verified ? t('verified') : t('notVerified')}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="font-medium">{t('planStatus')}</dt>
          <dd className="text-muted-foreground">
            {typeof account.plan_status === 'object' && account.plan_status !== null
              ? account.plan_status.label
              : (account.plan_status ?? '—')}
          </dd>
        </div>
      </dl>

      <p className="text-xs text-muted-foreground">{t('profileReadOnly')}</p>

      <Button variant="outline" onClick={() => void logout()} className="gap-2">
        <LogOut className="size-4" aria-hidden="true" />
        {t('logout')}
      </Button>
    </div>
  )
}
