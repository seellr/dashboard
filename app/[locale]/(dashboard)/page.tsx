import { adminFetchServer } from '@/lib/admin/api-server'
import { DashboardClient } from '@/components/admin/dashboard/DashboardClient'
import type { RevenueAnalytics, ProductPerformance, FunnelPerformance } from '@/types/dto/analytics.dto'
import type { CrmCustomer } from '@/types/dto/crm.dto'
import type { Order } from '@/types/dto/order.dto'

function defaultDateRange() {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 30)
  return {
    date_from: from.toISOString().slice(0, 10),
    date_to: to.toISOString().slice(0, 10),
  }
}

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const { date_from, date_to } = defaultDateRange()
  const dateParams = `date_from=${date_from}&date_to=${date_to}`

  const [revenueRes, ordersRes, productsRes, funnelsRes, crmRes] = await Promise.all([
    adminFetchServer<RevenueAnalytics>(`/admin/analytics/revenue?${dateParams}`),
    adminFetchServer<Order[]>('/admin/orders?per_page=5'),
    adminFetchServer<ProductPerformance[]>(`/admin/analytics/product-performance?${dateParams}`),
    adminFetchServer<FunnelPerformance[]>(`/admin/analytics/funnel-performance?${dateParams}`),
    adminFetchServer<CrmCustomer[]>('/admin/crm/customers?per_page=5'),
  ])

  return (
    <DashboardClient
      revenue={revenueRes.ok ? revenueRes.data : null}
      recentOrders={ordersRes.ok ? ordersRes.data : []}
      productPerf={productsRes.ok ? productsRes.data : []}
      funnelPerf={funnelsRes.ok ? funnelsRes.data : []}
      recentCustomers={crmRes.ok ? crmRes.data : []}
      locale={locale}
    />
  )
}
