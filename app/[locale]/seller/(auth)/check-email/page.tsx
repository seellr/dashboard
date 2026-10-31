import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { buttonVariants } from '@/components/ui/button'
import { AuthCard } from '@/components/seller/auth/AuthCard'

export default async function SellerCheckEmailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { locale } = await params
  const query = await searchParams
  const t = await getTranslations('seller.auth.checkEmail')

  const message = query.reason === 'verify' ? t('verifyMessage') : t('message')

  return (
    <AuthCard title={t('title')} description={message}>
      <div className="flex flex-col gap-3">
        <p className="rounded-lg border border-dashed bg-muted/40 p-3 text-center text-xs text-muted-foreground">
          {t('noResend')}
        </p>
        <Link
          href={`/${locale}/seller/login`}
          className={buttonVariants({ className: 'w-full' })}
        >
          {t('goToLogin')}
        </Link>
      </div>
    </AuthCard>
  )
}
