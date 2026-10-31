'use client'

import { RefreshCw, Store } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function StoreUnavailable({
  onRetry,
  message,
  polling = false,
}: {
  onRetry?: () => void
  message?: string
  polling?: boolean
}) {
  const t = useTranslations('seller.storeUnavailable')
  const router = useRouter()

  useEffect(() => {
    if (!polling) return
    const timer = window.setInterval(() => router.refresh(), 10000)
    return () => window.clearInterval(timer)
  }, [polling, router])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 rounded-xl border border-dashed bg-muted/20 p-8 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted">
        <Store className="size-7 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">{t('title')}</h2>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          {message ?? t('description')}
        </p>
      </div>
      {onRetry && (
        <Button type="button" variant="outline" onClick={onRetry} className="gap-2">
          <RefreshCw className="size-4" aria-hidden="true" />
          {t('retry')}
        </Button>
      )}
      {polling && <p className="text-xs text-muted-foreground">Checking store readiness…</p>}
    </div>
  )
}
