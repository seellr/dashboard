'use client'

import { sellerFetchClient } from '@/lib/seller/api-client'
import type { ApiResult } from '@/lib/shared/api-result'

export interface CursorMeta { per_page?: number; next_cursor?: string | null; has_more?: boolean }
export interface CursorPage<T> { items: T[]; meta: CursorMeta | null }
export interface SellerProduct { ulid: string; name?: string | null; internal_name?: string | null; status?: number | { id: number; label: string } | null; base_price?: string | number | null; currency?: string | null; type?: number | { id: number; label: string } | null }
export interface SellerMedia { ulid: string; name?: string | null; original_name?: string | null; url?: string | null; thumb_url?: string | null; mime_type?: string | null; file_size?: number | null; is_image?: boolean; alt_text?: string | null; folder?: string | null }
export interface SellerDomain { ulid: string; domain: string; verified?: boolean; is_primary?: boolean; verification_instruction?: string | null }
export interface SellerTheme { ulid: string; name?: string | null; slug?: string | null; preview_url?: string | null }

function page<T>(result: ApiResult<T[] | { data?: T[] }>): ApiResult<CursorPage<T>> {
  if (!result.ok) return result
  const value = result.data
  const items = Array.isArray(value) ? value : (value?.data ?? [])
  return { ok: true, data: { items, meta: result.meta ?? null }, meta: result.meta }
}

export async function listSellerProducts(query = '') { return page(await sellerFetchClient<SellerProduct[] | { data?: SellerProduct[] }>(`/products${query}`)) }
export async function createSellerProduct(body: unknown) { return sellerFetchClient<SellerProduct>('/products', { method: 'POST', body: JSON.stringify(body) }) }
export async function updateSellerProduct(ulid: string, body: unknown) { return sellerFetchClient<SellerProduct>(`/products/${encodeURIComponent(ulid)}`, { method: 'PUT', body: JSON.stringify(body) }) }
export async function deleteSellerProduct(ulid: string) { return sellerFetchClient<null>(`/products/${encodeURIComponent(ulid)}`, { method: 'DELETE' }) }
export async function saveSellerProductDescription(ulid: string, body: unknown) { return sellerFetchClient<unknown>(`/products/${encodeURIComponent(ulid)}/description`, { method: 'PUT', body: JSON.stringify(body) }) }
export async function saveSellerProductSeo(ulid: string, body: unknown) { return sellerFetchClient<unknown>(`/products/${encodeURIComponent(ulid)}/seo`, { method: 'PUT', body: JSON.stringify(body) }) }
export async function saveSellerProductDelivery(ulid: string, body: unknown) { return sellerFetchClient<unknown>(`/products/${encodeURIComponent(ulid)}/delivery`, { method: 'PUT', body: JSON.stringify(body) }) }
export async function saveSellerProductFunnel(ulid: string, body: unknown) { return sellerFetchClient<unknown>(`/products/${encodeURIComponent(ulid)}/funnel`, { method: 'PUT', body: JSON.stringify(body) }) }
export async function addSellerProductAsset(ulid: string, body: unknown) { return sellerFetchClient<null>(`/products/${encodeURIComponent(ulid)}/assets`, { method: 'POST', body: JSON.stringify(body) }) }
export async function deleteSellerProductAsset(ulid: string, assetId: number | string) { return sellerFetchClient<null>(`/products/${encodeURIComponent(ulid)}/assets/${encodeURIComponent(String(assetId))}`, { method: 'DELETE' }) }
export async function addSellerProductFaq(ulid: string, body: unknown) { return sellerFetchClient<null>(`/products/${encodeURIComponent(ulid)}/faqs`, { method: 'POST', body: JSON.stringify(body) }) }
export async function deleteSellerProductFaq(ulid: string, faqId: number | string) { return sellerFetchClient<null>(`/products/${encodeURIComponent(ulid)}/faqs/${encodeURIComponent(String(faqId))}`, { method: 'DELETE' }) }
export async function addSellerProductTestimonial(ulid: string, body: unknown) { return sellerFetchClient<null>(`/products/${encodeURIComponent(ulid)}/testimonials`, { method: 'POST', body: JSON.stringify(body) }) }
export async function deleteSellerProductTestimonial(ulid: string, testimonialId: number | string) { return sellerFetchClient<null>(`/products/${encodeURIComponent(ulid)}/testimonials/${encodeURIComponent(String(testimonialId))}`, { method: 'DELETE' }) }
export async function addSellerBundleItem(ulid: string, body: unknown) { return sellerFetchClient<null>(`/products/${encodeURIComponent(ulid)}/bundle-items`, { method: 'POST', body: JSON.stringify(body) }) }
export async function deleteSellerBundleItem(ulid: string, itemUlid: string) { return sellerFetchClient<null>(`/products/${encodeURIComponent(ulid)}/bundle-items/${encodeURIComponent(itemUlid)}`, { method: 'DELETE' }) }
export async function uploadSellerProductHero(ulid: string, form: FormData, signal?: AbortSignal) { return sellerFetchClient<SellerProduct>(`/products/${encodeURIComponent(ulid)}/hero-image`, { method: 'POST', body: form, signal }) }
export async function uploadSellerProductImage(ulid: string, form: FormData, signal?: AbortSignal) { return sellerFetchClient<null>(`/products/${encodeURIComponent(ulid)}/images`, { method: 'POST', body: form, signal }) }
export async function deleteSellerProductImage(ulid: string, imageId: number | string) { return sellerFetchClient<null>(`/products/${encodeURIComponent(ulid)}/images/${encodeURIComponent(String(imageId))}`, { method: 'DELETE' }) }
export async function listSellerMedia(query = '') { return page(await sellerFetchClient<SellerMedia[] | { data?: SellerMedia[] }>(`/media${query}`)) }
export async function uploadSellerMedia(form: FormData) { return sellerFetchClient<SellerMedia>('/media/upload', { method: 'POST', body: form }) }
export async function uploadSellerMediaMultiple(files: File[], folder?: string, signal?: AbortSignal) {
  const form = new FormData()
  for (const file of files) form.append('files[]', file)
  if (folder) form.append('folder', folder)
  return sellerFetchClient<SellerMedia[]>('/media/upload-multiple', { method: 'POST', body: form, signal })
}
export async function listSellerMediaFolders() { return sellerFetchClient<string[]>('/media/folders') }
export async function getSellerMedia(ulid: string) { return sellerFetchClient<SellerMedia>(`/media/${encodeURIComponent(ulid)}`) }
export async function updateSellerMedia(ulid: string, body: { name?: string; alt_text?: string | null; folder?: string | null }) { return sellerFetchClient<SellerMedia>(`/media/${encodeURIComponent(ulid)}`, { method: 'PUT', body: JSON.stringify(body) }) }
export async function deleteSellerMedia(ulid: string) { return sellerFetchClient<null>(`/media/${encodeURIComponent(ulid)}`, { method: 'DELETE' }) }
export async function bulkDeleteSellerMedia(ulids: string[]) { return sellerFetchClient<null>('/media/bulk-delete', { method: 'POST', body: JSON.stringify({ ulids }) }) }
export async function listSellerDomains() { return sellerFetchClient<SellerDomain[]>('/domains') }
export async function createSellerDomain(domain: string) { return sellerFetchClient<SellerDomain>('/domains', { method: 'POST', body: JSON.stringify({ domain }) }) }
export async function verifySellerDomain(ulid: string) { return sellerFetchClient<SellerDomain>(`/domains/${encodeURIComponent(ulid)}/verify`, { method: 'POST' }) }
export async function setPrimarySellerDomain(ulid: string) { return sellerFetchClient<SellerDomain>(`/domains/${encodeURIComponent(ulid)}/primary`, { method: 'POST' }) }
export async function deleteSellerDomain(ulid: string) { return sellerFetchClient<null>(`/domains/${encodeURIComponent(ulid)}`, { method: 'DELETE' }) }
export async function listSellerThemes(query = '') { return page(await sellerFetchClient<SellerTheme[] | { data?: SellerTheme[] }>(`/themes${query}`)) }
export async function activateSellerTheme(theme_ulid: string) { return sellerFetchClient<SellerTheme>('/theme/activate', { method: 'POST', body: JSON.stringify({ theme_ulid }) }) }
