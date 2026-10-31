import { getTranslations } from 'next-intl/server'
import { AuthCard } from '@/components/seller/auth/AuthCard'
import { SellerRegisterForm } from '@/components/seller/auth/SellerRegisterForm'

export default async function SellerRegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations('seller.auth.register')

  return (
    <AuthCard title={t('title')} description={t('subtitle')}>
      <SellerRegisterForm locale={locale} />
    </AuthCard>
  )
}
