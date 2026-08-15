import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { adminFetchServer } from '@/lib/admin/api-server'
import { getQueryClient } from '@/lib/admin/query-client'
import { FunnelTemplatesClient } from '@/components/admin/funnels/FunnelTemplatesClient'

export default async function AdminFunnelsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const queryClient = getQueryClient()

  // Server-side prefetch can't resolve the active brand (it lives in
  // localStorage via AdminBrandProvider), so it hydrates with brand 1. The
  // client component re-fetches with the active brand id on brand switch
  // through the existing ['admin'] query invalidation.
  const result = await adminFetchServer('/admin/funnel-templates?brand_id=1')

  await queryClient.prefetchQuery({
    queryKey: ['admin', 'funnel-templates'],
    queryFn: async () => (result.ok ? result.data : []),
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Funnel Templates</h1>
      </div>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <FunnelTemplatesClient locale={locale} />
      </HydrationBoundary>
    </div>
  )
}
