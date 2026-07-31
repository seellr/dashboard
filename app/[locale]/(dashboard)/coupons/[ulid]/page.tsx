import { getTranslations } from 'next-intl/server'
import { CouponFormClient } from '@/components/admin/coupons/CouponFormClient'

export default async function CouponEditPage({
  params,
}: {
  params: Promise<{ locale: string; ulid: string }>
}) {
  const { locale, ulid } = await params
  const t = await getTranslations('admin.coupons')

  return (
    <div className="flex flex-col gap-6">
      <CouponFormClient locale={locale} ulid={ulid} newLabel={t('new')} />
    </div>
  )
}
