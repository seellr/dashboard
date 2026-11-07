'use client'

import { adminFetchClient } from './api-client'

/** Typed access to the remaining platform operations documented for admins. */
export const adminOperationsApi = {
  listBrands: (query = '') => adminFetchClient<unknown[]>(`/brands${query}`),
  getBrand: (ulid: string) => adminFetchClient<unknown>(`/brands/${encodeURIComponent(ulid)}`),
  updateBrand: (ulid: string, body: unknown) => adminFetchClient<unknown>(`/brands/${encodeURIComponent(ulid)}`, { method: 'PUT', body: JSON.stringify(body) }),
  getBrandConfig: (ulid: string) => adminFetchClient<unknown>(`/brands/${encodeURIComponent(ulid)}/config`),
  updateBrandConfig: (ulid: string, body: unknown) => adminFetchClient<unknown>(`/brands/${encodeURIComponent(ulid)}/config`, { method: 'POST', body: JSON.stringify(body) }),
  getBrandLocale: (brandId: string | number, locale: string) => adminFetchClient<unknown>(`/brands/${encodeURIComponent(String(brandId))}/locale/${encodeURIComponent(locale)}`),
  getResolvedBrandLocale: (brandId: string | number, locale: string) => adminFetchClient<unknown>(`/brands/${encodeURIComponent(String(brandId))}/locale/${encodeURIComponent(locale)}/resolved`),
  importBrandLocale: (brandId: string | number, locale: string, body: unknown) => adminFetchClient<unknown>(`/brands/${encodeURIComponent(String(brandId))}/locale/${encodeURIComponent(locale)}/import`, { method: 'POST', body: JSON.stringify(body) }),
  setBrandLocaleKey: (brandId: string | number, locale: string, key: string, body: unknown) => adminFetchClient<unknown>(`/brands/${encodeURIComponent(String(brandId))}/locale/${encodeURIComponent(locale)}/${encodeURIComponent(key)}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteBrandLocaleKey: (brandId: string | number, locale: string, key: string) => adminFetchClient<null>(`/brands/${encodeURIComponent(String(brandId))}/locale/${encodeURIComponent(locale)}/${encodeURIComponent(key)}`, { method: 'DELETE' }),
  listTenants: (query = '') => adminFetchClient<unknown[]>(`/tenants${query}`),
  getTenant: (ulid: string) => adminFetchClient<unknown>(`/tenants/${encodeURIComponent(ulid)}`),
  provisionTenant: (subscriberUlid: string, body: unknown = {}) => adminFetchClient<unknown>(`/tenants/${encodeURIComponent(subscriberUlid)}/provision`, { method: 'POST', body: JSON.stringify(body) }),
  restoreTenant: (ulid: string) => adminFetchClient<unknown>(`/tenants/${encodeURIComponent(ulid)}/restore`, { method: 'POST' }),
  suspendTenant: (ulid: string, body: unknown = {}) => adminFetchClient<unknown>(`/tenants/${encodeURIComponent(ulid)}/suspend`, { method: 'POST', body: JSON.stringify(body) }),
  listActivityLogs: (query = '') => adminFetchClient<unknown[]>(`/activity-logs${query}`),
  listAuditLogs: (query = '') => adminFetchClient<unknown[]>(`/audit-logs${query}`),
  getDashboardStats: () => adminFetchClient<unknown>('/dashboard/stats'),
}
