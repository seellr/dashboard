import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminFetchClient } from '@/lib/admin/api-client'
import type { EmailSequence, CreateEmailSequenceInput, CreateEmailStepInput } from '@/types/dto/email-sequence.dto'

export const emailSequencesQueryKey = () => ['admin', 'email-sequences'] as const
export const emailSequenceQueryKey = (ulid: string) => ['admin', 'email-sequences', ulid] as const

export function useEmailSequencesQuery() {
  return useQuery({
    queryKey: emailSequencesQueryKey(),
    queryFn: async () => {
      const result = await adminFetchClient<EmailSequence[]>('/email/sequences')
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
  })
}

export function useEmailSequenceQuery(ulid: string) {
  return useQuery({
    queryKey: emailSequenceQueryKey(ulid),
    queryFn: async () => {
      const result = await adminFetchClient<EmailSequence>(`/email/sequences/${ulid}`)
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
  })
}

export function useCreateEmailSequenceMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateEmailSequenceInput & { brand_id: number }) => {
      const result = await adminFetchClient<EmailSequence>('/email/sequences', {
        method: 'POST', body: JSON.stringify(data),
      })
      if (!result.ok) throw new Error((result as { message: string }).message)
      return result.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: emailSequencesQueryKey() }),
  })
}

export function useUpdateEmailSequenceMutation(ulid: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<CreateEmailSequenceInput>) => {
      const result = await adminFetchClient<EmailSequence>(`/email/sequences/${ulid}`, {
        method: 'PUT', body: JSON.stringify(data),
      })
      if (!result.ok) throw new Error((result as { message: string }).message)
      return result.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: emailSequencesQueryKey() })
      qc.invalidateQueries({ queryKey: emailSequenceQueryKey(ulid) })
    },
  })
}

export function useDeleteEmailSequenceMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ulid: string) => {
      const result = await adminFetchClient(`/email/sequences/${ulid}`, { method: 'DELETE' })
      if (!result.ok) throw new Error((result as { message: string }).message)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: emailSequencesQueryKey() }),
  })
}

export function useAddEmailStepMutation(sequenceUlid: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateEmailStepInput) => {
      const result = await adminFetchClient(`/email/sequences/${sequenceUlid}/steps`, {
        method: 'POST', body: JSON.stringify(data),
      })
      if (!result.ok) throw new Error((result as { message: string }).message)
      return result.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: emailSequenceQueryKey(sequenceUlid) }),
  })
}

export function useDeleteEmailStepMutation(sequenceUlid: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (stepId: number) => {
      const result = await adminFetchClient(`/email/sequences/${sequenceUlid}/steps/${stepId}`, { method: 'DELETE' })
      if (!result.ok) throw new Error((result as { message: string }).message)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: emailSequenceQueryKey(sequenceUlid) }),
  })
}
