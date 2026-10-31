'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { buttonVariants } from '@/components/ui/button'
import { verifySellerEmail } from '@/lib/seller/auth-client'

type VerifyState = 'loading' | 'success' | 'error'

export function SellerVerifyEmailClient({
  locale,
  ulid,
  hash,
}: {
  locale: string
  ulid: string
  hash: string
}) {
  const t = useTranslations('seller.auth.verify')
  const [state, setState] = useState<VerifyState>('loading')
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    let active = true
    verifySellerEmail(ulid, hash).then((result) => {
      if (!active) return
      setState(result.ok ? 'success' : 'error')
    })

    return () => {
      active = false
    }
  }, [hash, ulid])

  if (state === 'loading') {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">{t('verifying')}</p>
      </div>
    )
  }

  if (state === 'success') {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <CheckCircle2 className="size-10 text-emerald-600" aria-hidden="true" />
        <div className="space-y-1">
          <h2 className="font-semibold">{t('successTitle')}</h2>
          <p className="text-sm text-muted-foreground">{t('successMessage')}</p>
        </div>
        <Link
          href={`/${locale}/seller/login`}
          className={buttonVariants({ className: 'w-full' })}
        >
          {t('goToLogin')}
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <XCircle className="size-10 text-destructive" aria-hidden="true" />
      <div className="space-y-1">
        <h2 className="font-semibold">{t('errorTitle')}</h2>
        <p className="text-sm text-muted-foreground">{t('errorMessage')}</p>
      </div>
      <Link
        href={`/${locale}/seller/login`}
        className={buttonVariants({ variant: 'outline', className: 'w-full' })}
      >
        {t('goToLogin')}
      </Link>
    </div>
  )
}
