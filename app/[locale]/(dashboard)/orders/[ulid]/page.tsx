import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { adminFetchServer } from '@/lib/admin/api-server'
import type { Order } from '@/types/dto/order.dto'

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ locale: string; ulid: string }>
}) {
  const { locale, ulid } = await params
  const t = await getTranslations('admin.orders')
  const result = await adminFetchServer<Order>(`/admin/orders/${ulid}`)

  if (!result.ok) {
    return <p className="text-destructive">{result.message}</p>
  }

  const order = result.data

  const rows: [string, string][] = [
    [t('detail.subtotal'), `${order.subtotal} ${order.currency}`],
    [t('detail.discount'), `${order.discount_amount} ${order.currency}`],
    [t('detail.vat'), `${order.vat_amount} ${order.currency}`],
    [t('detail.total'), `${order.total} ${order.currency}`],
    [t('detail.paymentMethod'), order.payment_method.label],
    [t('detail.paymentGateway'), order.payment_gateway?.label ?? '—'],
    [t('detail.shipping'), order.requires_shipping ? t('detail.yes') : t('detail.no')],
  ]

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div className="flex flex-col gap-2">
        <Link href={`/${locale}/admin/orders`} className="text-sm text-muted-foreground underline underline-offset-2">
          {t('detail.back')}
        </Link>
        <h1 className="text-xl font-semibold">{order.invoice_number ?? order.ulid}</h1>
        <span className="text-sm text-muted-foreground">{order.status.label}</span>
      </div>
      <dl className="flex flex-col gap-3">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between border-b pb-2">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="text-sm font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
