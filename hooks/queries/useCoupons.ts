import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminFetchClient } from '@/lib/admin/api-client'
import type { ApiMeta } from '@/lib/admin/api-server'
import type { Coupon, CreateCouponInput } from '@/types/dto/coupon.dto'

export const couponsQueryKey = (cursor?: string) => ['admin', 'coupons', cursor ?? null] as const
export const couponQueryKey = (ulid: string) => ['admin', 'coupons', ulid] as const

export function useCouponQuery(ulid: string) {
  return useQuery({
    queryKey: couponQueryKey(ulid),
    queryFn: async () => {
      const result = await adminFetchClient<Coupon>(`/coupons/${ulid}`)
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
    enabled: ulid !== 'new',
  })
}

export function useCouponsQuery(cursor?: string) {
  return useQuery({
    queryKey: couponsQueryKey(cursor),
    queryFn: async () => {
      const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''
      const result = await adminFetchClient<Coupon[]>(`/coupons${qs}`)
      if (!result.ok) throw new Error(result.message)
      return { items: result.data, meta: result.meta as ApiMeta | undefined }
    },
  })
}

export function useCreateCoupon() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateCouponInput) =>
      adminFetchClient<Coupon>('/coupons', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: (result) => {
      if (result.ok) queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] })
    },
  })
}

export function useUpdateCoupon(ulid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateCouponInput) =>
      adminFetchClient<Coupon>(`/coupons/${ulid}`, { method: 'PUT', body: JSON.stringify(input) }),
    onSuccess: (result) => {
      if (result.ok) queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] })
    },
  })
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ulid: string) => adminFetchClient<null>(`/coupons/${ulid}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] })
    },
  })
}
