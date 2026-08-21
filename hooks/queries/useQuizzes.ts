import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminFetchClient } from '@/lib/admin/api-client'
import { publicFetchClient } from '@/lib/public/api-client'
import type {
  Quiz,
  CreateQuizInput,
  UpdateQuizInput,
  CreateQuestionInput,
  CreateAnswerInput,
  CreateArchetypeInput,
  QuizSubmissionInput,
  QuizSubmissionResult,
} from '@/types/dto/quiz.dto'

export const quizzesQueryKey = () => ['admin', 'quizzes'] as const
export const quizQueryKey = (ulid: string) => ['admin', 'quizzes', ulid] as const
export const publicQuizQueryKey = (slug: string) => ['public', 'quiz', slug] as const
export const publicQuizResultQueryKey = (ulid: string) => ['public', 'quiz', 'result', ulid] as const

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
    enabled: !!ulid && ulid !== 'new',
  })
}

export function useCreateQuizMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateQuizInput) => {
      const result = await adminFetchClient<Quiz>('/quizzes', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: quizzesQueryKey() }),
  })
}

export function useUpdateQuizMutation(ulid: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: UpdateQuizInput) => {
      const result = await adminFetchClient<Quiz>(`/quizzes/${ulid}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: quizQueryKey(ulid) })
      qc.invalidateQueries({ queryKey: quizzesQueryKey() })
    },
  })
}

export function useDeleteQuizMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ulid: string) => {
      const result = await adminFetchClient(`/quizzes/${ulid}`, { method: 'DELETE' })
      if (!result.ok) throw new Error(result.message)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: quizzesQueryKey() }),
  })
}

// ================= Questions Mutations =================
export function useCreateQuestionMutation(quizUlid: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateQuestionInput) => {
      const result = await adminFetchClient(`/quizzes/${quizUlid}/questions`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: quizQueryKey(quizUlid) }),
  })
}

export function useUpdateQuestionMutation(quizUlid: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ questionId, data }: { questionId: number; data: Partial<CreateQuestionInput> }) => {
      const result = await adminFetchClient(`/quizzes/${quizUlid}/questions/${questionId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: quizQueryKey(quizUlid) }),
  })
}

export function useDeleteQuestionMutation(quizUlid: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (questionId: number) => {
      const result = await adminFetchClient(`/quizzes/${quizUlid}/questions/${questionId}`, { method: 'DELETE' })
      if (!result.ok) throw new Error(result.message)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: quizQueryKey(quizUlid) }),
  })
}

// ================= Answers Mutations =================
export function useCreateAnswerMutation(quizUlid: string, questionId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateAnswerInput) => {
      const result = await adminFetchClient(`/questions/${questionId}/answers`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: quizQueryKey(quizUlid) }),
  })
}

export function useUpdateAnswerMutation(quizUlid: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ questionId, answerId, data }: { questionId: number; answerId: number; data: Partial<CreateAnswerInput> }) => {
      const result = await adminFetchClient(`/questions/${questionId}/answers/${answerId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: quizQueryKey(quizUlid) }),
  })
}

export function useDeleteAnswerMutation(quizUlid: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ questionId, answerId }: { questionId: number; answerId: number }) => {
      const result = await adminFetchClient(`/questions/${questionId}/answers/${answerId}`, { method: 'DELETE' })
      if (!result.ok) throw new Error(result.message)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: quizQueryKey(quizUlid) }),
  })
}

// ================= Archetypes Mutations =================
export function useCreateArchetypeMutation(quizUlid: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateArchetypeInput) => {
      const result = await adminFetchClient(`/quizzes/${quizUlid}/archetypes`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: quizQueryKey(quizUlid) }),
  })
}

export function useUpdateArchetypeMutation(quizUlid: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ archetypeId, data }: { archetypeId: number; data: Partial<CreateArchetypeInput> }) => {
      const result = await adminFetchClient(`/quizzes/${quizUlid}/archetypes/${archetypeId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: quizQueryKey(quizUlid) }),
  })
}

export function useDeleteArchetypeMutation(quizUlid: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (archetypeId: number) => {
      const result = await adminFetchClient(`/quizzes/${quizUlid}/archetypes/${archetypeId}`, { method: 'DELETE' })
      if (!result.ok) throw new Error(result.message)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: quizQueryKey(quizUlid) }),
  })
}

export function useAttachArchetypeProductMutation(quizUlid: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ archetypeId, productUlid, sortOrder }: { archetypeId: number; productUlid: string; sortOrder?: number }) => {
      const result = await adminFetchClient(`/archetypes/${archetypeId}/products`, {
        method: 'POST',
        body: JSON.stringify({ product_ulid: productUlid, sort_order: sortOrder ?? 0 }),
      })
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: quizQueryKey(quizUlid) }),
  })
}

export function useDetachArchetypeProductMutation(quizUlid: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ archetypeId, productUlid }: { archetypeId: number; productUlid: string }) => {
      const result = await adminFetchClient(`/archetypes/${archetypeId}/products/${productUlid}`, { method: 'DELETE' })
      if (!result.ok) throw new Error(result.message)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: quizQueryKey(quizUlid) }),
  })
}

// ================= Public Hooks =================
export function usePublicQuizQuery(slug: string) {
  return useQuery({
    queryKey: publicQuizQueryKey(slug),
    queryFn: async () => {
      const res = await publicFetchClient<Quiz>(`/${slug}`)
      if (!res.ok) throw new Error(res.message)
      return res.data
    },
    enabled: !!slug,
  })
}

export function useSubmitQuizMutation(slug: string) {
  return useMutation({
    mutationFn: async (payload: QuizSubmissionInput) => {
      const res = await publicFetchClient<QuizSubmissionResult>(`/${slug}/submit`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(res.message)
      return res.data
    },
  })
}

export function usePublicQuizResultQuery(ulid: string) {
  return useQuery({
    queryKey: publicQuizResultQueryKey(ulid),
    queryFn: async () => {
      const res = await publicFetchClient<QuizSubmissionResult>(`/result/${ulid}`)
      if (!res.ok) throw new Error(res.message)
      return res.data
    },
    enabled: !!ulid,
  })
}
