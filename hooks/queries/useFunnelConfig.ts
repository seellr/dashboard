'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminFetchClient } from '@/lib/admin/api-client'
import type { FunnelConfig, UpsertFunnelConfigInput } from '@/types/dto/funnel.dto'

export const funnelConfigQueryKey = (productUlid: string) => ['admin', 'funnel-config', productUlid] as const

export function useFunnelConfigQuery(productUlid: string) {
  return useQuery({
    queryKey: funnelConfigQueryKey(productUlid),
    queryFn: async () => {
      const result = await adminFetchClient<FunnelConfig>(`/products/${productUlid}/funnel-config`)
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
    enabled: productUlid !== 'new',
  })
}

export function useUpsertFunnelConfig(productUlid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpsertFunnelConfigInput) =>
      adminFetchClient<FunnelConfig>(`/products/${productUlid}/funnel-config`, {
        method: 'PUT',
        body: JSON.stringify(input),
      }),
    onSuccess: (result) => {
      if (result.ok) queryClient.setQueryData(funnelConfigQueryKey(productUlid), result.data)
    },
  })
}
