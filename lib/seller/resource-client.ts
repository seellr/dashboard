'use client'

import { sellerFetchClient } from '@/lib/seller/api-client'
import type { ApiResult } from '@/lib/shared/api-result'

export interface CursorMeta {
  per_page?: number
  next_cursor?: string | null
  has_more?: boolean
}

export interface CursorPage<T> {
  items: T[]
  meta: CursorMeta | null
}

export type EnumValue = number | string | { id: number | string; label?: string | null } | null | undefined

export interface SellerProduct {
  ulid: string
  slug?: string | null
  name?: string | null
  internal_name?: string | null
  status?: EnumValue
  type?: EnumValue
  delivery_method?: EnumValue
  vat_rule?: EnumValue
  base_price?: string | number | null
  sale_price?: string | number | null
  currency?: string | null
  hero_image_url?: string | null
  featured?: boolean
  created_at?: string | null
  updated_at?: string | null
  description?: unknown
  seo_meta?: unknown
  delivery_config?: unknown
  funnel_config?: unknown
  images?: Array<{ id: number | string; url: string; alt_text?: string | null }>
  assets?: SellerProductAsset[]
  faqs?: SellerProductFaq[]
  testimonials?: SellerProductTestimonial[]
  bundle_items?: Array<{ ulid?: string; item_ulid?: string; name?: string | null }>
}

export interface SellerProductAsset {
  id: number | string
  name?: string | null
  asset_type?: EnumValue
  url?: string | null
  prompt_text?: string | null
}

export interface SellerProductFaq {
  id: number | string
  question?: string | null
  answer?: string | null
  translations?: unknown
}

export interface SellerProductTestimonial {
  id: number | string
  name?: string | null
  body?: string | null
  rating?: number | null
  translations?: unknown
}

export interface SellerMedia {
  ulid: string
  name?: string | null
  original_name?: string | null
  url?: string | null
  thumb_url?: string | null
  mime_type?: string | null
  file_size?: number | null
  file_size_kb?: number | null
  width?: number | null
  height?: number | null
  is_image?: boolean
  alt_text?: string | null
  folder?: string | null
  created_at?: string | null
}

export interface SellerDomain {
  ulid: string
  domain: string
  verified?: boolean
  is_primary?: boolean
  verification_instruction?: string | null
}

export interface SellerTheme {
  ulid: string
  theme_ulid?: string
  name?: string | null
  slug?: string | null
  preview_url?: string | null
  description?: string | null
  is_active?: boolean
}

export interface SellerThemeSetting {
  key: string
  type?: EnumValue
  label?: string | null
  value?: string | null
  default_value?: string | null
  options?: string | null | Array<{ value: string; label?: string | null }>
  sort_order?: number | null
}

export interface SellerActiveTheme {
  theme_ulid: string
  theme_name: string | { ar: string; en: string }
  activated_at?: string | null
  settings?: SellerThemeSetting[] | Record<string, unknown> | null
}

export interface SellerThemeSettingInput {
  key: string
  value: string
}

export interface SellerPlan {
  ulid?: string | null
  slug?: string | null
  name?: string | { ar: string; en: string } | null
  description?: string | { ar: string; en: string } | null
  price?: string | number | null
  monthly_price?: string | number | null
  annual_price?: string | number | null
  currency?: string | null
  max_sites?: number | null
  max_products?: number | null
  trial_days?: number | null
  is_active?: boolean
  active?: boolean
  features?: unknown[]
}

export interface ThemeStrings {
  [key: string]: unknown
}

function extractItems<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[]
  if (value && typeof value === 'object') {
    const record = value as { data?: unknown; items?: unknown; folders?: unknown }
    if (Array.isArray(record.data)) return record.data as T[]
    if (Array.isArray(record.items)) return record.items as T[]
    if (Array.isArray(record.folders)) return record.folders as T[]
  }
  return []
}

function page<T>(result: ApiResult<unknown>): ApiResult<CursorPage<T>> {
  if (!result.ok) return result
  return {
    ok: true,
    data: { items: extractItems<T>(result.data), meta: result.meta ?? null },
    meta: result.meta,
  }
}

function arrayData<T>(result: ApiResult<unknown>): ApiResult<T[]> {
  if (!result.ok) return result
  return { ok: true, data: extractItems<T>(result.data) }
}

// ── Products ────────────────────────────────────────────────────────────────

export async function listSellerProducts(query = '') {
  return page<SellerProduct>(await sellerFetchClient<SellerProduct[] | { data?: SellerProduct[] }>(`/products${query}`))
}
export async function getSellerProduct(ulid: string) {
  return sellerFetchClient<SellerProduct>(`/products/${encodeURIComponent(ulid)}`)
}
export async function createSellerProduct(body: unknown) {
  return sellerFetchClient<SellerProduct>('/products', { method: 'POST', body: JSON.stringify(body) })
}
export async function updateSellerProduct(ulid: string, body: unknown) {
  return sellerFetchClient<SellerProduct>(`/products/${encodeURIComponent(ulid)}`, { method: 'PUT', body: JSON.stringify(body) })
}
export async function deleteSellerProduct(ulid: string) {
  return sellerFetchClient<null>(`/products/${encodeURIComponent(ulid)}`, { method: 'DELETE' })
}
export async function saveSellerProductDescription(ulid: string, body: unknown) {
  return sellerFetchClient<unknown>(`/products/${encodeURIComponent(ulid)}/description`, { method: 'PUT', body: JSON.stringify(body) })
}
export async function saveSellerProductSeo(ulid: string, body: unknown) {
  return sellerFetchClient<unknown>(`/products/${encodeURIComponent(ulid)}/seo`, { method: 'PUT', body: JSON.stringify(body) })
}
export async function saveSellerProductDelivery(ulid: string, body: unknown) {
  return sellerFetchClient<unknown>(`/products/${encodeURIComponent(ulid)}/delivery`, { method: 'PUT', body: JSON.stringify(body) })
}
export async function saveSellerProductFunnel(ulid: string, body: unknown) {
  return sellerFetchClient<unknown>(`/products/${encodeURIComponent(ulid)}/funnel`, { method: 'PUT', body: JSON.stringify(body) })
}
export async function addSellerProductAsset(ulid: string, body: unknown) {
  return sellerFetchClient<unknown>(`/products/${encodeURIComponent(ulid)}/assets`, { method: 'POST', body: JSON.stringify(body) })
}
export async function deleteSellerProductAsset(ulid: string, assetId: number | string) {
  return sellerFetchClient<null>(`/products/${encodeURIComponent(ulid)}/assets/${encodeURIComponent(String(assetId))}`, { method: 'DELETE' })
}
export async function addSellerProductFaq(ulid: string, body: unknown) {
  return sellerFetchClient<unknown>(`/products/${encodeURIComponent(ulid)}/faqs`, { method: 'POST', body: JSON.stringify(body) })
}
export async function deleteSellerProductFaq(ulid: string, faqId: number | string) {
  return sellerFetchClient<null>(`/products/${encodeURIComponent(ulid)}/faqs/${encodeURIComponent(String(faqId))}`, { method: 'DELETE' })
}
export async function addSellerProductTestimonial(ulid: string, body: unknown) {
  return sellerFetchClient<unknown>(`/products/${encodeURIComponent(ulid)}/testimonials`, { method: 'POST', body: JSON.stringify(body) })
}
export async function deleteSellerProductTestimonial(ulid: string, testimonialId: number | string) {
  return sellerFetchClient<null>(`/products/${encodeURIComponent(ulid)}/testimonials/${encodeURIComponent(String(testimonialId))}`, { method: 'DELETE' })
}
export async function addSellerBundleItem(ulid: string, body: unknown) {
  return sellerFetchClient<unknown>(`/products/${encodeURIComponent(ulid)}/bundle-items`, { method: 'POST', body: JSON.stringify(body) })
}
export async function deleteSellerBundleItem(ulid: string, itemUlid: string) {
  return sellerFetchClient<null>(`/products/${encodeURIComponent(ulid)}/bundle-items/${encodeURIComponent(itemUlid)}`, { method: 'DELETE' })
}
export async function uploadSellerProductHero(ulid: string, form: FormData, signal?: AbortSignal) {
  return sellerFetchClient<SellerProduct>(`/products/${encodeURIComponent(ulid)}/hero-image`, { method: 'POST', body: form, signal })
}
export async function uploadSellerProductImage(ulid: string, form: FormData, signal?: AbortSignal) {
  return sellerFetchClient<unknown>(`/products/${encodeURIComponent(ulid)}/images`, { method: 'POST', body: form, signal })
}
export async function deleteSellerProductImage(ulid: string, imageId: number | string) {
  return sellerFetchClient<null>(`/products/${encodeURIComponent(ulid)}/images/${encodeURIComponent(String(imageId))}`, { method: 'DELETE' })
}

// ── Media ───────────────────────────────────────────────────────────────────

export async function listSellerMedia(query = '') {
  return page<SellerMedia>(await sellerFetchClient<SellerMedia[] | { data?: SellerMedia[] }>(`/media${query}`))
}
export async function uploadSellerMedia(form: FormData, signal?: AbortSignal) {
  return sellerFetchClient<SellerMedia>('/media/upload', { method: 'POST', body: form, signal })
}
export async function uploadSellerMediaMultiple(files: File[], folder?: string, signal?: AbortSignal) {
  const form = new FormData()
  for (const file of files) form.append('files[]', file)
  if (folder) form.append('folder', folder)
  return sellerFetchClient<SellerMedia[]>('/media/upload-multiple', { method: 'POST', body: form, signal })
}
export async function listSellerMediaFolders() {
  return arrayData<string>(
    await sellerFetchClient<string[] | { data?: string[] } | { folders?: string[] }>('/media/folders'),
  )
}
export async function getSellerMedia(ulid: string) {
  return sellerFetchClient<SellerMedia>(`/media/${encodeURIComponent(ulid)}`)
}
export async function updateSellerMedia(
  ulid: string,
  body: { name?: string; alt_text?: string | null; folder?: string | null },
) {
  return sellerFetchClient<SellerMedia>(`/media/${encodeURIComponent(ulid)}`, { method: 'PUT', body: JSON.stringify(body) })
}
export async function deleteSellerMedia(ulid: string) {
  return sellerFetchClient<null>(`/media/${encodeURIComponent(ulid)}`, { method: 'DELETE' })
}
export async function bulkDeleteSellerMedia(ulids: string[]) {
  return sellerFetchClient<null>('/media/bulk-delete', { method: 'POST', body: JSON.stringify({ ulids }) })
}

// ── Domains ─────────────────────────────────────────────────────────────────

export async function listSellerDomains() {
  return arrayData<SellerDomain>(
    await sellerFetchClient<SellerDomain[] | { data?: SellerDomain[] }>('/domains'),
  )
}
export async function createSellerDomain(domain: string) {
  return sellerFetchClient<SellerDomain>('/domains', { method: 'POST', body: JSON.stringify({ domain }) })
}
export async function verifySellerDomain(ulid: string) {
  return sellerFetchClient<SellerDomain>(`/domains/${encodeURIComponent(ulid)}/verify`, { method: 'POST' })
}
export async function setPrimarySellerDomain(ulid: string) {
  return sellerFetchClient<SellerDomain>(`/domains/${encodeURIComponent(ulid)}/primary`, { method: 'POST' })
}
export async function deleteSellerDomain(ulid: string) {
  return sellerFetchClient<null>(`/domains/${encodeURIComponent(ulid)}`, { method: 'DELETE' })
}

// ── Theme ───────────────────────────────────────────────────────────────────

export async function listSellerThemes(query = '') {
  return page<SellerTheme>(await sellerFetchClient<SellerTheme[] | { data?: SellerTheme[] }>(`/themes${query}`))
}
export async function getSellerTheme(ulid: string) {
  return sellerFetchClient<SellerTheme>(`/themes/${encodeURIComponent(ulid)}`)
}
export async function getActiveSellerTheme() {
  return sellerFetchClient<SellerActiveTheme | null>('/theme')
}
export async function activateSellerTheme(theme_ulid: string) {
  return sellerFetchClient<SellerActiveTheme>('/theme/activate', {
    method: 'POST',
    body: JSON.stringify({ theme_ulid }),
  })
}
export async function updateSellerThemeSettings(settings: SellerThemeSettingInput[]) {
  return sellerFetchClient<SellerActiveTheme>('/theme/settings', {
    method: 'PUT',
    body: JSON.stringify({ settings }),
  })
}
export async function getSellerTenant() {
  return sellerFetchClient<unknown>('/tenant')
}
export async function getSellerThemeStrings(locale: string) {
  return sellerFetchClient<ThemeStrings>(`/theme/locale/${encodeURIComponent(locale)}`)
}
export async function importSellerThemeStrings(locale: string, strings: ThemeStrings) {
  return sellerFetchClient<unknown>(`/theme/locale/${encodeURIComponent(locale)}/import`, {
    method: 'POST',
    body: JSON.stringify({ strings }),
  })
}
export async function updateSellerThemeString(locale: string, key: string, value: string) {
  return sellerFetchClient<unknown>(
    `/theme/locale/${encodeURIComponent(locale)}/${encodeURIComponent(key)}`,
    { method: 'PUT', body: JSON.stringify({ value }) },
  )
}
export async function deleteSellerThemeString(locale: string, key: string) {
  return sellerFetchClient<null>(
    `/theme/locale/${encodeURIComponent(locale)}/${encodeURIComponent(key)}`,
    { method: 'DELETE' },
  )
}

// ── Plans / account ─────────────────────────────────────────────────────────

export async function listSellerPlans() {
  return arrayData<SellerPlan>(
    await sellerFetchClient<SellerPlan[] | { data?: SellerPlan[] }>('/plans'),
  )
}
export async function getSellerAccount() {
  return sellerFetchClient<
    { user?: unknown; first_name?: string | null; email?: string | null }
  >('/auth/me')
}
export async function updateSellerAvatar(media_ulid: string) {
  return sellerFetchClient<unknown>('/auth/avatar', {
    method: 'PUT',
    body: JSON.stringify({ media_ulid }),
  })
}
