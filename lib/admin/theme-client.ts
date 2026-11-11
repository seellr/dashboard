import { adminFetchClient } from './api-client'

/**
 * `type` is returned as a `{ id, label }` enum object by the API, while the
 * documented create payload sends a `ThemeSettingTypeEnum` value (numeric in
 * current deployments). Keep both shapes accepted.
 */
export type AdminThemeSettingType =
  | number
  | string
  | { id: number | string; label?: string | null }

export type AdminThemeSetting = {
  ulid?: string
  key: string
  type: AdminThemeSettingType
  default_value?: string | null
  options?: string | null
  sort_order?: number | null
}

export type AdminThemeSettingInput = {
  key: string
  type: number
  default_value?: string | null
  options?: string | null
  sort_order?: number | null
}

export type AdminThemeTranslation = {
  /** Required by `POST /admin/themes` per All.md. */
  locale: string
  name: string
  description?: string | null
}

export type AdminTheme = {
  /** Numeric id is returned by the theme-locale endpoints; older responses may omit it. */
  id?: number | string
  ulid: string
  slug: string
  status: { id: number | string; label: string }
  name: string
  description?: string | null
  preview_url?: string | null
  version?: string | null
  has_manifest?: boolean
  settings?: AdminThemeSetting[] | null
  created_at: string
}

export type AdminThemeCreatePayload = {
  slug: string
  preview_url?: string | null
  translations: AdminThemeTranslation[]
  settings?: AdminThemeSettingInput[] | null
}

/**
 * All.md only documents `preview_url` for `PUT /admin/themes/{ulid}`.
 * Slug, translations and settings are set at creation time.
 */
export type AdminThemeUpdatePayload = {
  preview_url?: string | null
}

export type AdminThemeStrings = Record<string, string>

export const adminThemeApi = {
  list: (query = '') => adminFetchClient<AdminTheme[]>(`/themes${query}`),
  get: (ulid: string) => adminFetchClient<AdminTheme>(`/themes/${encodeURIComponent(ulid)}`),
  create: (body: AdminThemeCreatePayload) =>
    adminFetchClient<AdminTheme>('/themes', { method: 'POST', body: JSON.stringify(body) }),
  update: (ulid: string, body: AdminThemeUpdatePayload) =>
    adminFetchClient<AdminTheme>(`/themes/${encodeURIComponent(ulid)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  remove: (ulid: string) => adminFetchClient<null>(`/themes/${encodeURIComponent(ulid)}`, { method: 'DELETE' }),
  archive: (ulid: string) => adminFetchClient<AdminTheme>(`/themes/${encodeURIComponent(ulid)}/archive`, { method: 'POST' }),
  publish: (ulid: string) => adminFetchClient<AdminTheme>(`/themes/${encodeURIComponent(ulid)}/publish`, { method: 'POST' }),

  // Theme UI strings live under the numeric theme id, which is not always
  // present on ThemeResource. Callers should prefer `theme.id` and fall back
  // to the ulid (the backend accepts either for current deployments).
  getLocaleStrings: (themeId: string | number, locale: string) =>
    adminFetchClient<AdminThemeStrings>(
      `/themes/${encodeURIComponent(String(themeId))}/locale/${encodeURIComponent(locale)}`,
    ),
  importLocaleStrings: (themeId: string | number, locale: string, strings: AdminThemeStrings) =>
    adminFetchClient<unknown>(
      `/themes/${encodeURIComponent(String(themeId))}/locale/${encodeURIComponent(locale)}/import`,
      { method: 'POST', body: JSON.stringify({ strings }) },
    ),
  setLocaleString: (themeId: string | number, locale: string, key: string, value: string) =>
    adminFetchClient<{ key: string; value: string }>(
      `/themes/${encodeURIComponent(String(themeId))}/locale/${encodeURIComponent(locale)}/${encodeURIComponent(key)}`,
      { method: 'PUT', body: JSON.stringify({ value }) },
    ),
  deleteLocaleString: (themeId: string | number, locale: string, key: string) =>
    adminFetchClient<null>(
      `/themes/${encodeURIComponent(String(themeId))}/locale/${encodeURIComponent(locale)}/${encodeURIComponent(key)}`,
      { method: 'DELETE' },
    ),
}
