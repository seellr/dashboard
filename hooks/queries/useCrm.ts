import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminFetchClient } from '@/lib/admin/api-client'
import type { CrmCustomer, CrmEvent } from '@/types/dto/crm.dto'
import type { ApiMeta } from '@/lib/admin/api-server'

export const crmCustomersQueryKey = (cursor?: string) => ['admin', 'crm', 'customers', cursor ?? null] as const
export const crmCustomerQueryKey = (ulid: string) => ['admin', 'crm', 'customers', ulid] as const
export const crmEventsQueryKey = (ulid: string) => ['admin', 'crm', 'events', ulid] as const

export function useCrmCustomersQuery(cursor?: string) {
  return useQuery({
    queryKey: crmCustomersQueryKey(cursor),
    queryFn: async () => {
      const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''
      const result = await adminFetchClient<CrmCustomer[]>(`/crm/customers${qs}`)
      if (!result.ok) throw new Error(result.message)
      return { items: result.data, meta: result.meta as ApiMeta | undefined }
    },
  })
}

export function useCrmCustomerQuery(ulid: string) {
  return useQuery({
    queryKey: crmCustomerQueryKey(ulid),
    queryFn: async () => {
      const result = await adminFetchClient<CrmCustomer>(`/crm/customers/${ulid}`)
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
  })
}

export function useCrmEventsQuery(ulid: string) {
  return useQuery({
    queryKey: crmEventsQueryKey(ulid),
    queryFn: async () => {
      const result = await adminFetchClient<CrmEvent[]>(`/crm/customers/${ulid}/events`)
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
  })
}

export function useUpdateBuyerTypeMutation(ulid: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (buyer_type_id: number) => {
      const result = await adminFetchClient(`/crm/customers/${ulid}/buyer-type`, {
        method: 'PUT', body: JSON.stringify({ buyer_type_id }),
      })
      if (!result.ok) throw new Error((result as { message: string }).message)
      return result.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: crmCustomerQueryKey(ulid) }),
  })
}

export function useAddCrmTagMutation(ulid: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (tag: string) => {
      const result = await adminFetchClient(`/crm/customers/${ulid}/tags`, {
        method: 'POST', body: JSON.stringify({ tag }),
      })
      if (!result.ok) throw new Error((result as { message: string }).message)
      return result.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: crmCustomerQueryKey(ulid) }),
  })
}

export function useRemoveCrmTagMutation(ulid: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (tag: string) => {
      const result = await adminFetchClient(`/crm/customers/${ulid}/tags/${encodeURIComponent(tag)}`, {
        method: 'DELETE',
      })
      if (!result.ok) throw new Error((result as { message: string }).message)
      return result.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: crmCustomerQueryKey(ulid) }),
  })
}
