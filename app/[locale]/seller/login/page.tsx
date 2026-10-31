import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { SellerLoginForm } from '@/components/seller/auth/SellerLoginForm'
import { SellerLocaleSwitcher } from '@/components/seller/layout/SellerLocaleSwitcher'
import { sanitizeSellerNext } from '@/lib/seller/next-path'

export default async function SellerLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { locale } = await params
  const query = await searchParams

  const t = await getTranslations('seller.auth.login')

  const rawNext = typeof query.next === 'string' ? query.next : null
  const nextPath = sanitizeSellerNext(rawNext, locale)
  const expired = query.expired === '1'

  return (
    <div className="flex min-h-svh">
      <div className="flex w-full flex-col justify-between p-8 lg:w-[48%] lg:p-16">

        <div className="flex justify-end">
          <SellerLocaleSwitcher locale={locale} />
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-8">
          <div className="flex w-full max-w-sm flex-col gap-2 text-center">
            <h1 className="text-2xl font-semibold">{t('title')}</h1>
            <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
          </div>
          <div className="w-full max-w-sm">
            <SellerLoginForm
              locale={locale}
              nextPath={nextPath}
              initialError={expired ? t('sessionExpired') : undefined}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            <Link
              href={`/${locale}/login`}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {t('adminLink')}
            </Link>
          </p>
        </div>

        <div />
      </div>

      <div className="relative hidden overflow-hidden lg:flex lg:w-[52%] lg:items-end lg:p-16">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 90% at 15% 15%, color-mix(in oklch, var(--primary), white 8%) 0%, transparent 55%), ' +
              'radial-gradient(110% 90% at 85% 85%, color-mix(in oklch, var(--secondary), black 30%) 0%, transparent 55%), ' +
              'var(--primary)',
          }}
        />
        <p className="relative max-w-lg text-3xl font-semibold leading-tight text-primary-foreground">
          {t('heroText')}
        </p>
      </div>
    </div>
  )
}

