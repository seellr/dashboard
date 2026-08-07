import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminFetchClient } from '@/lib/admin/api-client'
import type { Quiz } from '@/types/dto/quiz.dto'

export const quizzesQueryKey = () => ['admin', 'quizzes'] as const
export const quizQueryKey = (ulid: string) => ['admin', 'quizzes', ulid] as const

export function useQuizzesQuery() {
  return useQuery({
    queryKey: quizzesQueryKey(),
    queryFn: async () => {
      const result = await adminFetchClient<Quiz[]>('/quizzes')
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
  })
}

export function useQuizQuery(ulid: string) {
  return useQuery({
    queryKey: quizQueryKey(ulid),
    queryFn: async () => {
      const result = await adminFetchClient<Quiz>(`/quizzes/${ulid}`)
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
    enabled: !!ulid,
  })
}

export function useCreateQuizMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const result = await adminFetchClient<Quiz>('/quizzes', {
        method: 'POST', body: JSON.stringify(data),
      })
      if (!result.ok) throw new Error((result as { message: string }).message)
      return result.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: quizzesQueryKey() }),
  })
}

export function useDeleteQuizMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ulid: string) => {
      const result = await adminFetchClient(`/quizzes/${ulid}`, { method: 'DELETE' })
      if (!result.ok) throw new Error((result as { message: string }).message)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: quizzesQueryKey() }),
  })
}
