
import { useQuery } from '@tanstack/react-query'
import { adminFetchClient } from '@/lib/admin/api-client'
import type { ApiMeta } from '@/lib/admin/api-server'
import type { Order } from '@/types/dto/order.dto'

export const ordersQueryKey = (cursor?: string) => ['admin', 'orders', cursor ?? null] as const
export const orderQueryKey = (ulid: string) => ['admin', 'orders', ulid] as const

export function useOrdersQuery(cursor?: string) {
  return useQuery({
    queryKey: ordersQueryKey(cursor),
    queryFn: async () => {
      const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''
      const result = await adminFetchClient<Order[]>(`/orders${qs}`)
      if (!result.ok) throw new Error(result.message)
      return { items: result.data, meta: result.meta as ApiMeta | undefined }
    },
  })
}

export function useOrderQuery(ulid: string) {
  return useQuery({
    queryKey: orderQueryKey(ulid),
    queryFn: async () => {
      const result = await adminFetchClient<Order>(`/orders/${ulid}`)
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
  })
}
