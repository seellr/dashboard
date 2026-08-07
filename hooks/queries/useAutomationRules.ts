import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminFetchClient } from '@/lib/admin/api-client'
import type { AutomationRule, CreateAutomationRuleInput } from '@/types/dto/automation-rule.dto'

export const automationRulesQueryKey = () => ['admin', 'automation-rules'] as const

export function useAutomationRulesQuery() {
  return useQuery({
    queryKey: automationRulesQueryKey(),
    queryFn: async () => {
      const result = await adminFetchClient<AutomationRule[]>('/automation-rules')
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
  })
}

export function useCreateAutomationRuleMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateAutomationRuleInput & { brand_id: number }) => {
      const result = await adminFetchClient<AutomationRule>('/automation-rules', {
        method: 'POST', body: JSON.stringify(data),
      })
      if (!result.ok) throw new Error((result as { message: string }).message)
      return result.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: automationRulesQueryKey() }),
  })
}

export function useDeleteAutomationRuleMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ulid: string) => {
      const result = await adminFetchClient(`/automation-rules/${ulid}`, { method: 'DELETE' })
      if (!result.ok) throw new Error((result as { message: string }).message)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: automationRulesQueryKey() }),
  })
}

export function useToggleAutomationRuleMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ulid: string) => {
      const result = await adminFetchClient(`/automation-rules/${ulid}/toggle`, { method: 'PUT' })
      if (!result.ok) throw new Error((result as { message: string }).message)
      return result.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: automationRulesQueryKey() }),
  })
}
