import { getTranslations } from 'next-intl/server'
import { SellerLocaleSwitcher } from '@/components/seller/layout/SellerLocaleSwitcher'

export default async function SellerAuthLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations('seller.auth.common')

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <div className="absolute end-4 top-4">
        <SellerLocaleSwitcher locale={locale} />
      </div>
      <div className="w-full max-w-md">
        <p className="mb-4 text-center text-sm font-semibold tracking-wide text-muted-foreground">
          {t('brand')}
        </p>
        {children}
      </div>
    </div>
  )
}
