import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminFetchClient } from '@/lib/admin/api-client'
import type { ApiMeta, ApiResult } from '@/lib/admin/api-server'
import type {
  CreateProductInput,
  Product,
  UpdateProductInput,
  ProductDescriptionInput,
  ProductSeoInput,
  ProductDeliveryInput,
  ProductAssetInput,
  ProductTestimonialInput,
  ProductFaqInput,
} from '@/types/dto/product.dto'

export const productsQueryKey = (cursor?: string) => ['admin', 'products', cursor ?? null] as const
export const productQueryKey = (ulid: string) => ['admin', 'product', ulid] as const


async function unwrap<T>(pending: Promise<ApiResult<T>>): Promise<T> {
  const result = await pending
  if (!result.ok) throw new Error(result.message)
  return result.data
}

export function useProductsQuery(cursor?: string) {
  return useQuery({
    queryKey: productsQueryKey(cursor),
    queryFn: async () => {
      const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''
      const result = await adminFetchClient<Product[]>(`/products${qs}`)
      if (!result.ok) throw new Error(result.message)
      return { items: result.data, meta: result.meta as ApiMeta | undefined }
    },
  })
}

export function useProductQuery(ulid: string) {
  return useQuery({
    queryKey: productQueryKey(ulid),
    queryFn: () => unwrap(adminFetchClient<Product>(`/products/${ulid}`)),
    enabled: ulid !== 'new',
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateProductInput) =>
      adminFetchClient<Product>('/products', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: (result) => {
      if (result.ok) queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
    },
  })
}

export function useUpdateProduct(ulid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateProductInput) =>
      adminFetchClient<Product>(`/products/${ulid}`, { method: 'PUT', body: JSON.stringify(input) }),
    onSuccess: (result) => {
      if (result.ok) {
        queryClient.setQueryData(productQueryKey(ulid), result.data)
        queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      }
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ulid: string) => adminFetchClient<null>(`/products/${ulid}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
    },
  })
}

export function useUpsertProductDescription(ulid: string) {
  return useMutation({
    mutationFn: (input: ProductDescriptionInput) =>
      adminFetchClient(`/products/${ulid}/description`, { method: 'PUT', body: JSON.stringify(input) }),
  })
}

export function useUpsertProductSeo(ulid: string) {
  return useMutation({
    mutationFn: (input: ProductSeoInput) =>
      adminFetchClient(`/products/${ulid}/seo`, { method: 'PUT', body: JSON.stringify(input) }),
  })
}

export function useUpsertProductDelivery(ulid: string) {
  return useMutation({
    mutationFn: (input: ProductDeliveryInput) =>
      adminFetchClient(`/products/${ulid}/delivery`, { method: 'PUT', body: JSON.stringify(input) }),
  })
}

export function useProductDescription(ulid: string) {
  return useQuery({
    queryKey: ['admin', 'products', ulid, 'description'],
    queryFn: () => unwrap(adminFetchClient<Record<string, unknown>>(`/products/${ulid}/description`)),
    enabled: ulid !== 'new',
  })
}

export function useProductSeo(ulid: string) {
  return useQuery({
    queryKey: ['admin', 'products', ulid, 'seo'],
    queryFn: () => unwrap(adminFetchClient<Record<string, unknown>>(`/products/${ulid}/seo`)),
    enabled: ulid !== 'new',
  })
}

export function useProductDelivery(ulid: string) {
  return useQuery({
    queryKey: ['admin', 'products', ulid, 'delivery'],
    queryFn: () => unwrap(adminFetchClient<Record<string, unknown>>(`/products/${ulid}/delivery`)),
    enabled: ulid !== 'new',
  })
}

export function useProductAssets(ulid: string) {
  return useQuery({
    queryKey: ['admin', 'products', ulid, 'assets'],
    queryFn: () => unwrap(adminFetchClient<Record<string, unknown>[]>(`/products/${ulid}/assets`)),
    enabled: ulid !== 'new',
  })
}

export function useAddProductAsset(ulid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ProductAssetInput) =>
      adminFetchClient(`/products/${ulid}/assets`, { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'products', ulid, 'assets'] }),
  })
}

export function useDeleteProductAsset(ulid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (assetId: number) =>
      adminFetchClient(`/products/${ulid}/assets/${assetId}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'products', ulid, 'assets'] }),
  })
}

export function useProductTestimonials(ulid: string) {
  return useQuery({
    queryKey: ['admin', 'products', ulid, 'testimonials'],
    queryFn: () => unwrap(adminFetchClient<Record<string, unknown>[]>(`/products/${ulid}/testimonials`)),
    enabled: ulid !== 'new',
  })
}

export function useAddProductTestimonial(ulid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ProductTestimonialInput) =>
      adminFetchClient(`/products/${ulid}/testimonials`, { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'products', ulid, 'testimonials'] }),
  })
}

export function useDeleteProductTestimonial(ulid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      adminFetchClient(`/products/${ulid}/testimonials/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'products', ulid, 'testimonials'] }),
  })
}

export function useProductFaqs(ulid: string) {
  return useQuery({
    queryKey: ['admin', 'products', ulid, 'faqs'],
    queryFn: () => unwrap(adminFetchClient<Record<string, unknown>[]>(`/products/${ulid}/faqs`)),
    enabled: ulid !== 'new',
  })
}

export function useAddProductFaq(ulid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ProductFaqInput) =>
      adminFetchClient(`/products/${ulid}/faqs`, { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'products', ulid, 'faqs'] }),
  })
}

export function useDeleteProductFaq(ulid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      adminFetchClient(`/products/${ulid}/faqs/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'products', ulid, 'faqs'] }),
  })
}
