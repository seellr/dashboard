import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { buttonVariants } from '@/components/ui/button'
import { AuthCard } from '@/components/seller/auth/AuthCard'
import { SellerResetPasswordForm } from '@/components/seller/auth/SellerResetPasswordForm'

export default async function SellerResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { locale } = await params
  const query = await searchParams
  const t = await getTranslations('seller.auth.reset')

  const token = typeof query.token === 'string' ? query.token : ''
  const email = typeof query.email === 'string' ? query.email : ''

  if (!token || !email) {
    return (
      <AuthCard title={t('title')} description={t('subtitle')}>
        <div className="flex flex-col gap-3 text-center">
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {t('missingToken')}
          </p>
          <Link
            href={`/${locale}/seller/login`}
            className={buttonVariants({ variant: 'outline', className: 'w-full' })}
          >
            {t('backToLogin')}
          </Link>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard title={t('title')} description={t('subtitle')}>
      <SellerResetPasswordForm
        locale={locale}
        token={token}
        email={email}
      />
    </AuthCard>
  )
}
