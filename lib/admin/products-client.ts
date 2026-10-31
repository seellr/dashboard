'use client'

import type { UseFormSetError, FieldValues, Path } from 'react-hook-form'
import type { ApiMeta, ApiResult } from '@/lib/admin/api-server'
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

function getClientHeaders(): Record<string, string> {
  const locale = typeof document !== 'undefined' ? (document.documentElement.lang || 'en') : 'en'
  const brandId =
    typeof window !== 'undefined'
      ? (localStorage.getItem('admin_active_brand_id') ?? '1')
      : '1'

  return {
    'x-locale': locale,
    'x-brand-id': brandId,
    Accept: 'application/json',
  }
}

async function productFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  try {
    const headers = {
      ...getClientHeaders(),
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers as Record<string, string> | undefined),
    }

    const res = await fetch(`/api/admin${path}`, {
      ...init,
      headers,
    })

    if (res.status === 204 || res.headers.get('content-length') === '0') {
      return { ok: true, data: null as unknown as T }
    }

    const text = await res.text()
    if (!text || text.trim() === '') {
      if (res.ok) {
        return { ok: true, data: null as unknown as T }
      }
      return {
        ok: false,
        message: `Request failed (${res.status})`,
        errorCode: `http_${res.status}`,
        errors: null,
        status: res.status,
      }
    }

    let json: Record<string, unknown> | null = null
    try {
      json = JSON.parse(text)
    } catch {
      return {
        ok: false,
        message: 'Failed to parse response JSON',
        errorCode: 'parse_error',
        errors: null,
        status: res.status,
      }
    }

    if (res.ok && json?.success !== false) {
      return {
        ok: true,
        data: (json?.data !== undefined ? json.data : json) as T,
        meta: (json?.meta as ApiMeta) ?? undefined,
      }
    }

    return {
      ok: false,
      message: (json?.message as string) || `Request failed (${res.status})`,
      errorCode: (json?.error_code as string) || (res.status === 422 ? 'validation_failed' : `http_${res.status}`),
      errors: (json?.errors as Record<string, string[]> | null) ?? null,
      status: res.status,
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return {
        ok: false,
        message: 'Request was canceled',
        errorCode: 'aborted',
        errors: null,
        status: 0,
      }
    }
    return {
      ok: false,
      message: 'Network error occurred',
      errorCode: 'network_error',
      errors: null,
      status: 0,
    }
  }
}

/**
 * Maps backend 422 validation errors to react-hook-form fields.
 */
export function setFormApiErrors<T extends FieldValues>(
  errors: Record<string, string[]> | null,
  setError: UseFormSetError<T>,
): void {
  if (!errors) return
  for (const [field, messages] of Object.entries(errors)) {
    const message = messages[0] || 'Invalid field'
    setError(field as unknown as Path<T>, {
      type: 'server',
      message,
    })
  }
}

// ── Product CRUD ────────────────────────────────────────────────────────────

export interface ListProductsParams {
  filter_brand_id?: number
  type?: number
  status?: number
  featured?: boolean
  per_page?: number
  cursor?: string | null
}

export async function listProducts(
  params?: ListProductsParams,
): Promise<ApiResult<Product[]>> {
  const qs = new URLSearchParams()
  if (params?.filter_brand_id) qs.set('filter_brand_id', String(params.filter_brand_id))
  if (params?.type) qs.set('type', String(params.type))
  if (params?.status) qs.set('status', String(params.status))
  if (params?.featured !== undefined) qs.set('featured', String(params.featured))
  if (params?.per_page) qs.set('per_page', String(params.per_page))
  if (params?.cursor) qs.set('cursor', params.cursor)

  const query = qs.toString() ? `?${qs.toString()}` : ''
  return productFetch<Product[]>(`/products${query}`)
}

export async function getProduct(ulid: string): Promise<ApiResult<Product>> {
  return productFetch<Product>(`/products/${encodeURIComponent(ulid)}`)
}

export async function createProduct(
  input: CreateProductInput,
): Promise<ApiResult<Product>> {
  return productFetch<Product>('/products', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function updateProduct(
  ulid: string,
  input: UpdateProductInput,
): Promise<ApiResult<Product>> {
  return productFetch<Product>(`/products/${encodeURIComponent(ulid)}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export async function deleteProduct(ulid: string): Promise<ApiResult<null>> {
  return productFetch<null>(`/products/${encodeURIComponent(ulid)}`, {
    method: 'DELETE',
  })
}

// ── Sub-resources ───────────────────────────────────────────────────────────

export async function updateProductDescription(
  ulid: string,
  input: ProductDescriptionInput,
): Promise<ApiResult<null>> {
  return productFetch<null>(`/products/${encodeURIComponent(ulid)}/description`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export async function updateProductSeo(
  ulid: string,
  input: ProductSeoInput,
): Promise<ApiResult<null>> {
  return productFetch<null>(`/products/${encodeURIComponent(ulid)}/seo`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export async function updateProductDelivery(
  ulid: string,
  input: ProductDeliveryInput,
): Promise<ApiResult<null>> {
  return productFetch<null>(`/products/${encodeURIComponent(ulid)}/delivery`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export async function updateProductFunnel(
  ulid: string,
  input: Record<string, unknown>,
): Promise<ApiResult<null>> {
  return productFetch<null>(`/products/${encodeURIComponent(ulid)}/funnel`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export async function createProductAsset(
  ulid: string,
  input: ProductAssetInput,
): Promise<ApiResult<null>> {
  return productFetch<null>(`/products/${encodeURIComponent(ulid)}/assets`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function deleteProductAsset(
  ulid: string,
  assetId: string | number,
): Promise<ApiResult<null>> {
  return productFetch<null>(
    `/products/${encodeURIComponent(ulid)}/assets/${encodeURIComponent(String(assetId))}`,
    {
      method: 'DELETE',
    },
  )
}

export async function createProductFaq(
  ulid: string,
  input: ProductFaqInput,
): Promise<ApiResult<null>> {
  return productFetch<null>(`/products/${encodeURIComponent(ulid)}/faqs`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function deleteProductFaq(
  ulid: string,
  faqId: string | number,
): Promise<ApiResult<null>> {
  return productFetch<null>(
    `/products/${encodeURIComponent(ulid)}/faqs/${encodeURIComponent(String(faqId))}`,
    {
      method: 'DELETE',
    },
  )
}

export async function createProductTestimonial(
  ulid: string,
  input: ProductTestimonialInput,
): Promise<ApiResult<null>> {
  return productFetch<null>(`/products/${encodeURIComponent(ulid)}/testimonials`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function deleteProductTestimonial(
  ulid: string,
  testimonialId: string | number,
): Promise<ApiResult<null>> {
  return productFetch<null>(
    `/products/${encodeURIComponent(ulid)}/testimonials/${encodeURIComponent(String(testimonialId))}`,
    {
      method: 'DELETE',
    },
  )
}

export async function getProductBundleItems(
  ulid: string,
): Promise<ApiResult<Product[]>> {
  return productFetch<Product[]>(`/products/${encodeURIComponent(ulid)}/bundle-items`)
}

export async function addProductBundleItem(
  ulid: string,
  input: ProductBundleItemInput,
): Promise<ApiResult<null>> {
  return productFetch<null>(`/products/${encodeURIComponent(ulid)}/bundle-items`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function deleteProductBundleItem(
  ulid: string,
  itemUlid: string,
): Promise<ApiResult<null>> {
  return productFetch<null>(
    `/products/${encodeURIComponent(ulid)}/bundle-items/${encodeURIComponent(itemUlid)}`,
    {
      method: 'DELETE',
    },
  )
}

export async function addProductCrmTag(
  ulid: string,
  input: ProductCrmTagInput,
): Promise<ApiResult<null>> {
  return productFetch<null>(`/products/${encodeURIComponent(ulid)}/crm-tags`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function deleteProductCrmTag(
  ulid: string,
  tagId: string | number,
): Promise<ApiResult<null>> {
  return productFetch<null>(
    `/products/${encodeURIComponent(ulid)}/crm-tags/${encodeURIComponent(String(tagId))}`,
    {
      method: 'DELETE',
    },
  )
}

export async function updateProductVisibility(
  ulid: string,
  input: ProductVisibilityInput,
): Promise<ApiResult<null>> {
  return productFetch<null>(`/products/${encodeURIComponent(ulid)}/visibility`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}
