import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminFetchClient } from '@/lib/admin/api-client'
import type { AiTool } from '@/types/dto/ai-tool.dto'

export const aiToolsQueryKey = () => ['admin', 'ai-tools'] as const
export const aiToolQueryKey = (ulid: string) => ['admin', 'ai-tools', ulid] as const

export function useAiToolsQuery() {
  return useQuery({
    queryKey: aiToolsQueryKey(),
    queryFn: async () => {
      const result = await adminFetchClient<AiTool[]>('/ai-tools')
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
  })
}

export function useAiToolQuery(ulid: string) {
  return useQuery({
    queryKey: aiToolQueryKey(ulid),
    queryFn: async () => {
      const result = await adminFetchClient<AiTool>(`/ai-tools/${ulid}`)
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
    enabled: !!ulid,
  })
}

export function useCreateAiToolMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const result = await adminFetchClient<AiTool>('/ai-tools', {
        method: 'POST', body: JSON.stringify(data),
      })
      if (!result.ok) throw new Error((result as { message: string }).message)
      return result.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: aiToolsQueryKey() }),
  })
}

export function useUpdateAiToolMutation(ulid: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const result = await adminFetchClient<AiTool>(`/ai-tools/${ulid}`, {
        method: 'PUT', body: JSON.stringify(data),
      })
      if (!result.ok) throw new Error((result as { message: string }).message)
      return result.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: aiToolsQueryKey() })
      qc.invalidateQueries({ queryKey: aiToolQueryKey(ulid) })
    },
  })
}

export function useDeleteAiToolMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ulid: string) => {
      const result = await adminFetchClient(`/ai-tools/${ulid}`, { method: 'DELETE' })
      if (!result.ok) throw new Error((result as { message: string }).message)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: aiToolsQueryKey() }),
  })
}
