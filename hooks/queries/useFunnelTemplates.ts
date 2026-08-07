import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminFetchClient } from '@/lib/admin/api-client'
import type { FunnelTemplate, CreateFunnelTemplateInput } from '@/types/dto/funnel-template.dto'

export const funnelTemplatesQueryKey = () => ['admin', 'funnel-templates'] as const

export function useFunnelTemplatesQuery() {
  return useQuery({
    queryKey: funnelTemplatesQueryKey(),
    queryFn: async () => {
      const result = await adminFetchClient<FunnelTemplate[]>('/funnel-templates?brand_id=1')
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
  })
}

export function useCreateFunnelTemplateMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateFunnelTemplateInput & { brand_id: number }) => {
      const result = await adminFetchClient<FunnelTemplate>('/funnel-templates', {
        method: 'POST', body: JSON.stringify(data),
      })
      if (!result.ok) throw new Error((result as { message: string }).message)
      return result.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: funnelTemplatesQueryKey() }),
  })
}

export function useUpdateFunnelTemplateMutation(ulid: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<CreateFunnelTemplateInput>) => {
      const result = await adminFetchClient<FunnelTemplate>(`/funnel-templates/${ulid}`, {
        method: 'PUT', body: JSON.stringify(data),
      })
      if (!result.ok) throw new Error((result as { message: string }).message)
      return result.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: funnelTemplatesQueryKey() }),
  })
}

export function useDeleteFunnelTemplateMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ulid: string) => {
      const result = await adminFetchClient(`/funnel-templates/${ulid}`, { method: 'DELETE' })
      if (!result.ok) throw new Error((result as { message: string }).message)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: funnelTemplatesQueryKey() }),
  })
}
