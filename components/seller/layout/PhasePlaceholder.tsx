'use client'

import { Construction } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function PhasePlaceholder({ title }: { title?: string }) {
  const t = useTranslations('seller.phasePlaceholder')

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/20 p-8 text-center">
      <Construction className="size-8 text-muted-foreground" aria-hidden="true" />
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">{title ?? t('title')}</h2>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          {t('description')}
        </p>
      </div>
    </div>
  )
}
