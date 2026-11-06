'use client'

import { useState } from 'react'
import { ShieldAlert } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

export function ImpersonationBanner({
  name,
  locale,
}: {
  name: string
  locale: string
}) {
  const t = useTranslations('seller.impersonation')
  const [busy, setBusy] = useState(false)

  const end = async () => {
    setBusy(true)
    try {
      await fetch('/api/subscriber/auth/impersonation/end', {
        method: 'POST',
        headers: { 'x-locale': locale },
      })
    } finally {
      window.location.assign(`/${locale}/seller/login?impersonationEnded=1`)
    }
  }

  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-3 border-b border-amber-300/60 bg-amber-50 px-6 py-2 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100"
    >
      <ShieldAlert className="size-4 shrink-0" aria-hidden="true" />
      <p className="flex-1">{t('message', { name })}</p>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => void end()}
        disabled={busy}
      >
        {busy ? t('ending') : t('end')}
      </Button>
    </div>
  )
}
