'use client'

import { adminFetchClient } from './api-client'

export interface BrandConfigData {
  logo_url?: string | null
  favicon_url?: string | null
  primary_color?: string | null
  secondary_color?: string | null
  bg_color?: string | null
  text_color?: string | null
  font_heading?: string | null
  font_body?: string | null
  currency?: string | null
  store_email?: string | null
  store_phone?: string | null
  store_address?: string | null
  country_code?: string | null
  timezone?: string | null
  instagram_url?: string | null
  facebook_url?: string | null
  twitter_url?: string | null
  youtube_url?: string | null
  tiktok_url?: string | null
  snapchat_url?: string | null
  linkedin_url?: string | null
  whatsapp_number?: string | null
  google_analytics_id?: string | null
  facebook_pixel_id?: string | null
}

export interface BrandRecord {
  ulid: string
  name?: string | null
  slug?: string | null
  domain?: string | null
  active?: boolean
  config?: BrandConfigData | null
}

export interface BrandCoreInput {
  name?: string
  slug?: string
  domain?: string | null
  active?: boolean
}

export type BrandConfigInput = {
  logo?: File | null
  favicon?: File | null
  primary_color?: string
  secondary_color?: string
  bg_color?: string
  text_color?: string
  font_heading?: string
  font_body?: string
  currency?: string
  store_email?: string | null
  store_phone?: string | null
  store_address?: string | null
  country_code?: string | null
  timezone?: string
  instagram_url?: string | null
  facebook_url?: string | null
  twitter_url?: string | null
  youtube_url?: string | null
  tiktok_url?: string | null
  snapchat_url?: string | null
  linkedin_url?: string | null
  whatsapp_number?: string | null
  google_analytics_id?: string | null
  facebook_pixel_id?: string | null
}

function brandConfigForm(body: BrandConfigInput | FormData): FormData {
  if (typeof FormData !== 'undefined' && body instanceof FormData) return body
  const form = new FormData()
  for (const [key, value] of Object.entries(body)) {
    if (value === undefined || value === null) continue
    if (value instanceof File) {
      form.append(key, value)
    } else {
      form.append(key, String(value))
    }
  }
  return form
}

/** Typed access to the remaining platform operations documented for admins. */
export const adminOperationsApi = {
  listBrands: (query = '') => adminFetchClient<BrandRecord[]>(`/brands${query}`),
  getBrand: (ulid: string) => adminFetchClient<BrandRecord>(`/brands/${encodeURIComponent(ulid)}`),
  updateBrand: (ulid: string, body: BrandCoreInput) => adminFetchClient<BrandRecord>(`/brands/${encodeURIComponent(ulid)}`, { method: 'PUT', body: JSON.stringify(body) }),
  getBrandConfig: (ulid: string) => adminFetchClient<BrandConfigData>(`/brands/${encodeURIComponent(ulid)}/config`),
  updateBrandConfig: (ulid: string, body: BrandConfigInput | FormData) =>
    adminFetchClient<BrandConfigData>(`/brands/${encodeURIComponent(ulid)}/config`, {
      method: 'POST',
      body: brandConfigForm(body),
    }),
  uploadBrandLogo: (ulid: string, file: File) => {
    const form = new FormData()
    form.append('logo', file)
    return adminFetchClient<BrandConfigData>(`/brands/${encodeURIComponent(ulid)}/logo`, {
      method: 'POST',
      body: form,
    })
  },
  uploadBrandFavicon: (ulid: string, file: File) => {
    const form = new FormData()
    form.append('favicon', file)
    return adminFetchClient<BrandConfigData>(`/brands/${encodeURIComponent(ulid)}/favicon`, {
      method: 'POST',
      body: form,
    })
  },
  getBrandLocale: (brandId: string | number, locale: string) => adminFetchClient<unknown>(`/brands/${encodeURIComponent(String(brandId))}/locale/${encodeURIComponent(locale)}`),
  getResolvedBrandLocale: (brandId: string | number, locale: string) => adminFetchClient<unknown>(`/brands/${encodeURIComponent(String(brandId))}/locale/${encodeURIComponent(locale)}/resolved`),
  exportBrandLocale: (brandId: string | number, locale: string) => adminFetchClient<unknown>(`/brands/${encodeURIComponent(String(brandId))}/locale/${encodeURIComponent(locale)}/export`),
  importBrandLocale: (brandId: string | number, locale: string, body: unknown) => adminFetchClient<unknown>(`/brands/${encodeURIComponent(String(brandId))}/locale/${encodeURIComponent(locale)}/import`, { method: 'POST', body: JSON.stringify(body) }),
  setBrandLocaleKey: (brandId: string | number, locale: string, key: string, body: unknown) => adminFetchClient<unknown>(`/brands/${encodeURIComponent(String(brandId))}/locale/${encodeURIComponent(locale)}/${encodeURIComponent(key)}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteBrandLocaleKey: (brandId: string | number, locale: string, key: string) => adminFetchClient<null>(`/brands/${encodeURIComponent(String(brandId))}/locale/${encodeURIComponent(locale)}/${encodeURIComponent(key)}`, { method: 'DELETE' }),
  getLocaleDefaults: (locale: string) => adminFetchClient<unknown>(`/locale/defaults/${encodeURIComponent(locale)}`),
  listDomains: (query = '') => adminFetchClient<unknown[]>(`/domains${query}`),
  listTenants: (query = '') => adminFetchClient<unknown[]>(`/tenants${query}`),
  getTenant: (ulid: string) => adminFetchClient<unknown>(`/tenants/${encodeURIComponent(ulid)}`),
  provisionTenant: (subscriberUlid: string, body: unknown = {}) => adminFetchClient<unknown>(`/tenants/${encodeURIComponent(subscriberUlid)}/provision`, { method: 'POST', body: JSON.stringify(body) }),
  restoreTenant: (ulid: string) => adminFetchClient<unknown>(`/tenants/${encodeURIComponent(ulid)}/restore`, { method: 'POST' }),
  suspendTenant: (ulid: string, body: unknown = {}) => adminFetchClient<unknown>(`/tenants/${encodeURIComponent(ulid)}/suspend`, { method: 'POST', body: JSON.stringify(body) }),
  listActivityLogs: (query = '') => adminFetchClient<unknown[]>(`/activity-logs${query}`),
  listAuditLogs: (query = '') => adminFetchClient<unknown[]>(`/audit-logs${query}`),
  getDashboardStats: () => adminFetchClient<unknown>('/dashboard/stats'),
}
