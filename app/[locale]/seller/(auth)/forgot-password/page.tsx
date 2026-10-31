import { getTranslations } from 'next-intl/server'
import { AuthCard } from '@/components/seller/auth/AuthCard'
import { SellerForgotPasswordForm } from '@/components/seller/auth/SellerForgotPasswordForm'

export default async function SellerForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations('seller.auth.forgot')

  return (
    <AuthCard title={t('title')} description={t('subtitle')}>
      <SellerForgotPasswordForm locale={locale} />
    </AuthCard>
  )
}
