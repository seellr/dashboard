import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getTranslations } from 'next-intl/server'
import { adminFetchServer } from '@/lib/admin/api-server'
import { getQueryClient } from '@/lib/admin/query-client'
import { ordersQueryKey } from '@/hooks/queries/useOrders'
import { OrdersTableClient } from '@/components/admin/orders/OrdersTableClient'
import type { Order } from '@/types/dto/order.dto'

export default async function AdminOrdersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations('admin.orders')
  const queryClient = getQueryClient()

  const result = await adminFetchServer<Order[]>('/admin/orders')

  await queryClient.prefetchQuery({
    queryKey: ordersQueryKey(),
    queryFn: async () => ({
      items: result.ok ? result.data : [],
      meta: result.ok ? result.meta : undefined,
    }),
  })

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">{t('title')}</h1>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <OrdersTableClient locale={locale} />
      </HydrationBoundary>
    </div>
  )
}
