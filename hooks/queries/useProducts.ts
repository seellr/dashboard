import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addProductBundleItem,
  addProductCrmTag,
  createProduct,
  createProductAsset,
  createProductFaq,
  createProductTestimonial,
  deleteProduct,
  deleteProductAsset,
  deleteProductBundleItem,
  deleteProductCrmTag,
  deleteProductFaq,
  deleteProductTestimonial,
  getProduct,
  getProductBundleItems,
  listProducts,
  updateProduct,
  updateProductDelivery,
  updateProductDescription,
  updateProductFunnel,
  updateProductSeo,
  updateProductVisibility,
  type ListProductsParams,
} from '@/lib/admin/products-client'
import type {
  CreateProductInput,
  Product,
  ProductAssetInput,
  ProductBundleItemInput,
  ProductCrmTagInput,
  ProductDeliveryInput,
  ProductDescriptionInput,
  ProductFaqInput,
  ProductSeoInput,
  ProductTestimonialInput,
  ProductVisibilityInput,
  UpdateProductInput,
} from '@/types/dto/product.dto'

export const productKeys = {
  all: ['admin', 'products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (params?: ListProductsParams) => [...productKeys.lists(), params ?? {}] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (ulid: string) => [...productKeys.details(), ulid] as const,
  bundleItems: (ulid: string) => [...productKeys.detail(ulid), 'bundle-items'] as const,
}

// Backward-compatible query keys
export const productsQueryKey = (cursor?: string) => ['admin', 'products', cursor ?? null] as const
export const productQueryKey = (ulid: string) => ['admin', 'product', ulid] as const

export function useProductsQuery(params?: ListProductsParams | string) {
  const queryParams = typeof params === 'string' ? { cursor: params } : params

  return useQuery({
    queryKey: productKeys.list(queryParams),
    queryFn: async () => {
      const res = await listProducts(queryParams)
      if (!res.ok) {
        throw new Error(res.message || 'Failed to fetch products')
      }
      return {
        items: res.data ?? [],
        meta: res.meta,
      }
    },
    staleTime: 30_000,
  })
}

export function useProductQuery(ulid: string | null | undefined) {
  return useQuery({
    queryKey: productKeys.detail(ulid ?? ''),
    queryFn: async () => {
      if (!ulid || ulid === 'new') return null
      const res = await getProduct(ulid)
      if (!res.ok) {
        throw new Error(res.message || 'Failed to fetch product')
      }
      return res.data
    },
    enabled: Boolean(ulid && ulid !== 'new'),
  })
}

export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateProductInput) => createProduct(input),
    onSuccess: (res) => {
      if (res.ok) {
        qc.invalidateQueries({ queryKey: productKeys.all })
      }
    },
  })
}

export function useUpdateProduct(ulid: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateProductInput) => updateProduct(ulid, input),
    onSuccess: (res) => {
      if (res.ok) {
        qc.setQueryData(productKeys.detail(ulid), res.data)
        qc.invalidateQueries({ queryKey: productKeys.all })
      }
    },
  })
}

export function useDeleteProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ulid: string) => deleteProduct(ulid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKeys.all })
    },
  })
}

export function useUpsertProductDescription(ulid: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ProductDescriptionInput) => updateProductDescription(ulid, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKeys.detail(ulid) })
    },
  })
}

export function useUpsertProductSeo(ulid: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ProductSeoInput) => updateProductSeo(ulid, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKeys.detail(ulid) })
    },
  })
}

export function useUpsertProductDelivery(ulid: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ProductDeliveryInput) => updateProductDelivery(ulid, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKeys.detail(ulid) })
    },
  })
}

export function useUpsertProductFunnel(ulid: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: Record<string, unknown>) => updateProductFunnel(ulid, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKeys.detail(ulid) })
    },
  })
}

export function useCreateProductAsset(ulid: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ProductAssetInput) => createProductAsset(ulid, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKeys.detail(ulid) })
    },
  })
}

export function useDeleteProductAsset(ulid: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (assetId: string | number) => deleteProductAsset(ulid, assetId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKeys.detail(ulid) })
    },
  })
}

export function useCreateProductFaq(ulid: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ProductFaqInput) => createProductFaq(ulid, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKeys.detail(ulid) })
    },
  })
}

export function useDeleteProductFaq(ulid: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (faqId: string | number) => deleteProductFaq(ulid, faqId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKeys.detail(ulid) })
    },
  })
}

export function useCreateProductTestimonial(ulid: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ProductTestimonialInput) => createProductTestimonial(ulid, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKeys.detail(ulid) })
    },
  })
}

export function useDeleteProductTestimonial(ulid: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (testimonialId: string | number) => deleteProductTestimonial(ulid, testimonialId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKeys.detail(ulid) })
    },
  })
}

export function useProductBundleItems(ulid: string) {
  return useQuery({
    queryKey: productKeys.bundleItems(ulid),
    queryFn: async () => {
      if (!ulid) return []
      const res = await getProductBundleItems(ulid)
      if (!res.ok) throw new Error(res.message || 'Failed to fetch bundle items')
      return res.data ?? []
    },
    enabled: Boolean(ulid),
  })
}

export function useAddProductBundleItem(ulid: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ProductBundleItemInput) => addProductBundleItem(ulid, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKeys.bundleItems(ulid) })
      qc.invalidateQueries({ queryKey: productKeys.detail(ulid) })
    },
  })
}

export function useDeleteProductBundleItem(ulid: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (itemUlid: string) => deleteProductBundleItem(ulid, itemUlid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKeys.bundleItems(ulid) })
      qc.invalidateQueries({ queryKey: productKeys.detail(ulid) })
    },
  })
}

export function useAddProductCrmTag(ulid: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ProductCrmTagInput) => addProductCrmTag(ulid, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKeys.detail(ulid) })
    },
  })
}

export function useDeleteProductCrmTag(ulid: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (tagId: string | number) => deleteProductCrmTag(ulid, tagId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKeys.detail(ulid) })
    },
  })
}

export function useUpdateProductVisibility(ulid: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ProductVisibilityInput) => updateProductVisibility(ulid, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKeys.detail(ulid) })
    },
  })
}
