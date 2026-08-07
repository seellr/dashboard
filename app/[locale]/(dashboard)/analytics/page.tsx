import { getTranslations } from 'next-intl/server'
import { adminFetchServer } from '@/lib/admin/api-server'
import { AnalyticsClient } from '@/components/admin/analytics/AnalyticsClient'
import type { RevenueAnalytics, ProductPerformance, FunnelPerformance } from '@/components/admin/analytics/AnalyticsClient'

function defaultDateRange() {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 30)
  return {
    date_from: from.toISOString().slice(0, 10),
    date_to: to.toISOString().slice(0, 10),
  }
}

export default async function AdminAnalyticsPage() {
  const t = await getTranslations('admin')
  const { date_from, date_to } = defaultDateRange()
  const params = `date_from=${date_from}&date_to=${date_to}`

  const [revenueResult, productsResult, funnelsResult] = await Promise.all([
    adminFetchServer<RevenueAnalytics>(`/admin/analytics/revenue?${params}`),
    adminFetchServer<ProductPerformance[]>(`/admin/analytics/product-performance?${params}`),
    adminFetchServer<FunnelPerformance[]>(`/admin/analytics/funnel-performance?${params}`),
  ])

  const initialRevenue = revenueResult.ok ? revenueResult.data : null
  const initialProducts = productsResult.ok ? productsResult.data : null
  const initialFunnels = funnelsResult.ok ? funnelsResult.data : null

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">{t('nav.analytics')}</h1>
      <AnalyticsClient
        initialRevenue={initialRevenue}
        initialProducts={initialProducts}
        initialFunnels={initialFunnels}
        defaultDateFrom={date_from}
        defaultDateTo={date_to}
      />
    </div>
  )
}
