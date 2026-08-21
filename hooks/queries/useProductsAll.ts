import { useQuery } from '@tanstack/react-query'
import { adminFetchClient } from '@/lib/admin/api-client'
import type { Product } from '@/types/dto/product.dto'

// Fetches all products (no cursor) for use in pickers/selects
export function useProductsAllQuery() {
  return useQuery({
    queryKey: ['admin', 'products', 'all'],
    queryFn: async () => {
      const result = await adminFetchClient<Product[]>('/products?per_page=100')
      if (!result.ok) return []
      return result.data
    },
    staleTime: 60_000,
  })
}
