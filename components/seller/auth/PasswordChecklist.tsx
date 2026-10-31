'use client'

import { Check, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

export function PasswordChecklist({ password }: { password: string }) {
  const t = useTranslations('seller.auth.passwordChecklist')

  const rules = [
    { key: 'length', met: password.length >= 8 && password.length <= 128 },
    { key: 'upper', met: /[A-Z]/.test(password) },
    { key: 'lower', met: /[a-z]/.test(password) },
    { key: 'digit', met: /\d/.test(password) },
    { key: 'symbol', met: /[^A-Za-z0-9]/.test(password) },
  ] as const

  return (
    <ul className="grid gap-1 text-xs" aria-live="polite">
      {rules.map(({ key, met }) => (
        <li
          key={key}
          className={cn(
            'flex items-center gap-1.5',
            met ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground',
          )}
        >
          {met ? (
            <Check className="size-3.5" aria-hidden="true" />
          ) : (
            <X className="size-3.5" aria-hidden="true" />
          )}
          {t(key)}
        </li>
      ))}
    </ul>
  )
}
