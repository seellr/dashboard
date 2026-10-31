import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { buttonVariants } from '@/components/ui/button'
import { AuthCard } from '@/components/seller/auth/AuthCard'
import { SellerVerifyEmailClient } from '@/components/seller/auth/SellerVerifyEmailClient'

export default async function SellerVerifyEmailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { locale } = await params
  const query = await searchParams
  const t = await getTranslations('seller.auth.verify')

  const ulid = typeof query.ulid === 'string' ? query.ulid : ''
  const hash = typeof query.hash === 'string' ? query.hash : ''

  if (!ulid || !hash) {
    return (
      <AuthCard title={t('errorTitle')} description={t('errorMessage')}>
        <Link
          href={`/${locale}/seller/login`}
          className={buttonVariants({ variant: 'outline', className: 'w-full' })}
        >
          {t('goToLogin')}
        </Link>
      </AuthCard>
    )
  }

  // TODO(backend): confirm the real verification-link format. The current
  // implementation expects ?ulid=...&hash=... and forwards through our proxy.
  return (
    <AuthCard title={t('title')}>
      <SellerVerifyEmailClient locale={locale} ulid={ulid} hash={hash} />
    </AuthCard>
  )
}
