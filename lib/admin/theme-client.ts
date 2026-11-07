import { adminFetchClient } from './api-client'

export type AdminThemeSetting = {
  key: string
  type: number
  default_value?: string | null
  options?: string | null
  sort_order?: number | null
}

export type AdminThemeTranslation = {
  name: string
  description?: string | null
}

export type AdminTheme = {
  ulid: string
  slug: string
  status: { id: number | string; label: string }
  name: string
  description?: string | null
  preview_url?: string | null
  settings?: AdminThemeSetting[] | null
  created_at: string
}

export type AdminThemePayload = {
  slug: string
  preview_url?: string | null
  translations: AdminThemeTranslation[]
  settings?: AdminThemeSetting[] | null
}

export const adminThemeApi = {
  list: (query = '') => adminFetchClient<AdminTheme[]>(`/themes${query}`),
  create: (body: AdminThemePayload) => adminFetchClient<AdminTheme>('/themes', { method: 'POST', body: JSON.stringify(body) }),
  update: (ulid: string, body: Partial<AdminThemePayload>) => adminFetchClient<AdminTheme>(`/themes/${encodeURIComponent(ulid)}`, { method: 'PUT', body: JSON.stringify(body) }),
  remove: (ulid: string) => adminFetchClient<null>(`/themes/${encodeURIComponent(ulid)}`, { method: 'DELETE' }),
  archive: (ulid: string) => adminFetchClient<AdminTheme>(`/themes/${encodeURIComponent(ulid)}/archive`, { method: 'POST' }),
  publish: (ulid: string) => adminFetchClient<AdminTheme>(`/themes/${encodeURIComponent(ulid)}/publish`, { method: 'POST' }),
}
