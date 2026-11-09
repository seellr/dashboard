'use client'

import { adminFetchClient } from './api-client'

export interface PlatformAdmin { ulid: string; name?: string | null; email?: string | null; status?: { id: number | string; label: string }; roles?: Array<{ id: number | string; name?: string; label?: string }> }
export interface PlatformSubscriber { ulid: string; name?: string | null; email?: string | null; status?: { id: number | string; label: string }; tenant?: unknown }
export interface PlatformPlan { ulid: string; name?: string | null; slug?: string | null; price?: string | number | null; currency?: string | null; active?: boolean }
export interface ContentTranslation { key: string; value?: string | null; locale?: string; resource?: string }

export const platformAdminApi = {
  listAdmins: (query = '') => adminFetchClient<PlatformAdmin[]>(`/admins${query}`),
  createAdmin: (body: unknown) => adminFetchClient<PlatformAdmin>('/admins', { method: 'POST', body: JSON.stringify(body) }),
  getAdmin: (ulid: string) => adminFetchClient<PlatformAdmin>(`/admins/${encodeURIComponent(ulid)}`),
  updateAdmin: (ulid: string, body: unknown) => adminFetchClient<PlatformAdmin>(`/admins/${encodeURIComponent(ulid)}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteAdmin: (ulid: string) => adminFetchClient<null>(`/admins/${encodeURIComponent(ulid)}`, { method: 'DELETE' }),
  approveAdmin: (ulid: string, role: 'content_manager' | 'support_agent') => adminFetchClient<PlatformAdmin>(`/admins/${encodeURIComponent(ulid)}/approve`, { method: 'POST', body: JSON.stringify({ role }) }),
  addAdminRole: (ulid: string, role: string) => adminFetchClient<PlatformAdmin>(`/admins/${encodeURIComponent(ulid)}/roles`, { method: 'POST', body: JSON.stringify({ role }) }),
  removeAdminRole: (ulid: string, role: string) => adminFetchClient<null>(`/admins/${encodeURIComponent(ulid)}/roles/${encodeURIComponent(role)}`, { method: 'DELETE' }),
  listSubscribers: (query = '') => adminFetchClient<PlatformSubscriber[]>(`/subscribers${query}`),
  impersonateSubscriber: (ulid: string) => adminFetchClient<{ impersonating: boolean }>(`/subscribers/${encodeURIComponent(ulid)}/impersonate`, { method: 'POST' }),
  endImpersonation: (sessionUlid: string) => adminFetchClient<null>(`/impersonations/${encodeURIComponent(sessionUlid)}/end`, { method: 'POST' }),
  listPlans: () => adminFetchClient<PlatformPlan[]>('/plans'),
  getPlan: (ulid: string) => adminFetchClient<PlatformPlan>(`/plans/${encodeURIComponent(ulid)}`),
  createPlan: (body: unknown) => adminFetchClient<PlatformPlan>('/plans', { method: 'POST', body: JSON.stringify(body) }),
  updatePlan: (ulid: string, body: unknown) => adminFetchClient<PlatformPlan>(`/plans/${encodeURIComponent(ulid)}`, { method: 'PUT', body: JSON.stringify(body) }),
  deletePlan: (ulid: string) => adminFetchClient<null>(`/plans/${encodeURIComponent(ulid)}`, { method: 'DELETE' }),
  listRoles: () => adminFetchClient<unknown[]>('/roles'),
  listTranslationResources: () => adminFetchClient<string[]>('/content-translations/resources'),
  listTranslations: (resource: string, query = '') => adminFetchClient<ContentTranslation[]>(`/content-translations/${encodeURIComponent(resource)}${query}`),
  getTranslation: (resource: string, ulid: string) => adminFetchClient<ContentTranslation>(`/content-translations/${encodeURIComponent(resource)}/${encodeURIComponent(ulid)}`),
  updateTranslation: (resource: string, ulid: string, body: unknown) => adminFetchClient<ContentTranslation>(`/content-translations/${encodeURIComponent(resource)}/${encodeURIComponent(ulid)}`, { method: 'PUT', body: JSON.stringify(body) }),
}
