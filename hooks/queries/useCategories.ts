import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminFetchClient } from '@/lib/admin/api-client'
import type { Category, CreateCategoryInput } from '@/types/dto/category.dto'

export const categoriesQueryKey = () => ['admin', 'categories'] as const
export const categoryQueryKey = (ulid: string) => ['admin', 'categories', ulid] as const

export function useCategoriesQuery() {
  return useQuery({
    queryKey: categoriesQueryKey(),
    queryFn: async () => {
      const result = await adminFetchClient<Category[]>('/categories?brand_id=1&active_only=0')
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
  })
}

export function useCreateCategoryMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateCategoryInput & { brand_id: number }) => {
      const result = await adminFetchClient<Category>('/categories', {
        method: 'POST', body: JSON.stringify(data),
      })
      if (!result.ok) throw new Error((result as { message: string }).message)
      return result.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: categoriesQueryKey() }),
  })
}

export function useUpdateCategoryMutation(ulid: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<CreateCategoryInput>) => {
      const result = await adminFetchClient<Category>(`/categories/${ulid}`, {
        method: 'PUT', body: JSON.stringify(data),
      })
      if (!result.ok) throw new Error((result as { message: string }).message)
      return result.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: categoriesQueryKey() }),
  })
}

export function useDeleteCategoryMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ulid: string) => {
      const result = await adminFetchClient(`/categories/${ulid}`, { method: 'DELETE' })
      if (!result.ok) throw new Error((result as { message: string }).message)
      return result.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: categoriesQueryKey() }),
  })
}
