import { apiEnvelopeSchema } from '@/shared/schemas/api'
import type { ApiEnvelope, BuilderPage, Locale, PreviewTokenResponse, SubscriberTheme, ThemeSchema, ThemeSummary } from '@/shared/types/builder'

export class BuilderApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly fields?: Record<string, string[]>

  constructor(status: number, payload: ApiEnvelope<unknown>) {
    super(payload.message ?? 'Request failed')
    this.name = 'BuilderApiError'
    this.status = status
    this.code = payload.error_code
    this.fields = payload.errors
  }
}

export async function builderFetch<T>(
  path: string,
  options: RequestInit & { locale?: Locale } = {},
): Promise<ApiEnvelope<T>> {
  const { locale = 'en', headers, ...request } = options
  const response = await fetch(`/api/subscriber/${path.replace(/^\//, '')}`, {
    ...request,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'x-locale': locale, ...headers },
  })
  const text = await response.text()
  let parsed: unknown = { success: response.ok, data: null }
  if (text) {
    try { parsed = JSON.parse(text) as unknown } catch { throw new BuilderApiError(response.status, { success: false, message: 'Invalid API response' }) }
  }
  const result = apiEnvelopeSchema.safeParse(parsed)
  if (!result.success) throw new BuilderApiError(response.status, { success: false, message: 'Invalid API response' })
  const envelope = result.data as ApiEnvelope<T>
  if (!response.ok || !envelope.success) throw new BuilderApiError(response.status, envelope)
  return envelope
}

export const subscriberThemeApi = {
  listThemes: (locale: Locale, cursor?: string) =>
    builderFetch(`/themes?per_page=15${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`, { locale, method: 'GET' }),
  getTheme: (locale: Locale, ulid: string) => builderFetch<ThemeSummary>(`/themes/${ulid}`, { locale, method: 'GET' }),
  getActiveTheme: (locale: Locale) => builderFetch<SubscriberTheme>('/theme', { locale, method: 'GET' }),
  getSchema: (locale: Locale) => builderFetch<ThemeSchema>('/theme/schema', { locale, method: 'GET' }),
  listPages: (locale: Locale) => builderFetch<BuilderPage[]>(`/pages?per_page=100`, { locale, method: 'GET' }),
  getDraft: (locale: Locale, pageUlid: string) => builderFetch<BuilderPage>(`/pages/${pageUlid}/draft`, { locale, method: 'GET' }),
  saveDraft: (locale: Locale, pageUlid: string, page: BuilderPage) => builderFetch<BuilderPage>(`/pages/${pageUlid}/draft`, { locale, method: 'PUT', body: JSON.stringify(page) }),
  createPreviewToken: (locale: Locale, pageUlid: string) => builderFetch<PreviewTokenResponse>('/theme/preview-token', { locale, method: 'POST', body: JSON.stringify({ page_ulid: pageUlid }) }),
  publish: (locale: Locale, pageUlid: string) => builderFetch<unknown>('/theme/publish', { locale, method: 'POST', body: JSON.stringify({ page_ulid: pageUlid }) }),
  discard: (locale: Locale, pageUlid: string) => builderFetch<BuilderPage>('/theme/discard', { locale, method: 'POST', body: JSON.stringify({ page_ulid: pageUlid }) }),
  getLocaleStrings: (locale: Locale, targetLocale: Locale) => builderFetch<Record<string, string>>(`/theme/locale/${targetLocale}`, { locale, method: 'GET' }),
  setLocaleString: (locale: Locale, targetLocale: Locale, key: string, value: string) => builderFetch<unknown>(`/theme/locale/${targetLocale}/${encodeURIComponent(key)}`, { locale, method: 'PUT', body: JSON.stringify({ value }) }),
  deleteLocaleString: (locale: Locale, targetLocale: Locale, key: string) => builderFetch<unknown>(`/theme/locale/${targetLocale}/${encodeURIComponent(key)}`, { locale, method: 'DELETE' }),
  importLocaleStrings: (locale: Locale, targetLocale: Locale, strings: Record<string, string>) => builderFetch<unknown>(`/theme/locale/${targetLocale}/import`, { locale, method: 'POST', body: JSON.stringify({ strings }) }),
  activate: (locale: Locale, theme_ulid: string) =>
    builderFetch<SubscriberTheme>('/theme/activate', { locale, method: 'POST', body: JSON.stringify({ theme_ulid }) }),
}
