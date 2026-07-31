import { useQuery } from '@tanstack/react-query'
import { adminFetchClient } from '@/lib/admin/api-client'
import type { RevenueAnalytics, ProductPerformance, FunnelPerformance } from '@/types/dto/analytics.dto'

export const revenueQueryKey = (params?: Record<string, string>) => ['admin', 'analytics', 'revenue', params ?? {}] as const
export const productPerfQueryKey = (params?: Record<string, string>) => ['admin', 'analytics', 'products', params ?? {}] as const
export const funnelPerfQueryKey = (params?: Record<string, string>) => ['admin', 'analytics', 'funnels', params ?? {}] as const

function buildQs(params?: Record<string, string>) {
  const base = 'brand_id=1'
  if (!params) return `?${base}`
  const extra = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')
  return `?${base}&${extra}`
}

export function useRevenueQuery(params?: Record<string, string>) {
  return useQuery({
    queryKey: revenueQueryKey(params),
    queryFn: async () => {
      const result = await adminFetchClient<RevenueAnalytics>(`/analytics/revenue${buildQs(params)}`)
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
  })
}

export function useProductPerfQuery(params?: Record<string, string>) {
  return useQuery({
    queryKey: productPerfQueryKey(params),
    queryFn: async () => {
      const result = await adminFetchClient<ProductPerformance[]>(`/analytics/product-performance${buildQs(params)}`)
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
  })
}

export function useFunnelPerfQuery(params?: Record<string, string>) {
  return useQuery({
    queryKey: funnelPerfQueryKey(params),
    queryFn: async () => {
      const result = await adminFetchClient<FunnelPerformance[]>(`/analytics/funnel-performance${buildQs(params)}`)
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
  })
}
