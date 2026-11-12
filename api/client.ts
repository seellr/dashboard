import { apiEnvelopeSchema } from '@/shared/schemas/api'
import type { ApiEnvelope, BlockInstance, BuilderPage, Locale, PreviewTokenResponse, SectionInstance, SubscriberTheme, ThemeSchema, ThemeSummary } from '@/shared/types/builder'

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
    // Drafts change from one save to the next; never serve them from the HTTP
    // cache or a reload can show the previous draft.
    cache: 'no-store',
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

export interface ThemeSettingInput {
  key: string
  value: string
}

/**
 * The draft endpoints are undocumented. The GET response returns
 * `{ page, sections }` where each section is `{ ulid, type, hidden, settings,
 * blocks }`; the PUT body is built from the same instance shape so existing
 * sections keep their ULIDs instead of being recreated on every save.
 */
function toBlockPayload(block: BlockInstance) {
  const payload: Record<string, unknown> = {
    type: block.type,
    // Older manifests name the block type `handle`; send both so either
    // validation rule is satisfied (extra keys are ignored by the API).
    handle: block.type,
    settings: block.settings ?? {},
    hidden: block.hidden === true,
  }
  if (block.ulid) payload.ulid = block.ulid
  return payload
}

function toSectionPayload(section: SectionInstance) {
  const payload: Record<string, unknown> = {
    type: section.type,
    handle: section.type,
    settings: section.settings ?? {},
    hidden: section.hidden === true,
  }
  if (section.ulid) payload.ulid = section.ulid
  if (section.blocks) payload.blocks = section.blocks.map(toBlockPayload)
  return payload
}

function toPagePayload(page: BuilderPage) {
  return {
    type: page.type,
    slug: page.slug ?? null,
    title: page.name.en,
    translations: {
      ar: { title: page.name.ar },
      en: { title: page.name.en },
    },
  }
}

export const subscriberThemeApi = {
  listThemes: (locale: Locale, cursor?: string) =>
    builderFetch<ThemeSummary[]>(`/themes?per_page=15${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`, { locale, method: 'GET' }),
  getTheme: (locale: Locale, ulid: string) => builderFetch<ThemeSummary>(`/themes/${ulid}`, { locale, method: 'GET' }),
  getActiveTheme: (locale: Locale) => builderFetch<SubscriberTheme>('/theme', { locale, method: 'GET' }),
  /**
   * `PUT /subscriber/theme/settings` expects an array of `{ key, value }`
   * pairs, not a key/value map (see All.md §Theme).
   */
  updateThemeSettings: (locale: Locale, settings: ThemeSettingInput[]) =>
    builderFetch<SubscriberTheme>('/theme/settings', { locale, method: 'PUT', body: JSON.stringify({ settings }) }),
  getSchema: (locale: Locale) => builderFetch<ThemeSchema>('/theme/schema', { locale, method: 'GET' }),
  listPages: (locale: Locale) => builderFetch<BuilderPage[]>(`/pages?per_page=100`, { locale, method: 'GET' }),
  getDraft: (locale: Locale, pageUlid: string) => builderFetch<BuilderPage>(`/pages/${pageUlid}/draft`, { locale, method: 'GET' }),
  saveDraft: async (locale: Locale, pageUlid: string, page: BuilderPage) => {
    const path = `/pages/${pageUlid}/draft`
    const sections = page.sections.map(toSectionPayload)
    // `GET .../draft` returns `{ page, sections }`, so try that envelope first;
    // some builds only accept the sections array. Only validation failures are
    // retried — in that case nothing has been written.
    const bodies = [
      { page: toPagePayload(page), sections },
      { sections },
      { ...toPagePayload(page), sections },
    ]
    let lastError: unknown
    for (const body of bodies) {
      try {
        return await builderFetch<BuilderPage>(path, {
          locale,
          method: 'PUT',
          body: JSON.stringify(body),
        })
      } catch (error) {
        lastError = error
        if (!(error instanceof BuilderApiError) || (error.status !== 400 && error.status !== 422)) throw error
      }
    }
    throw lastError
  },
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
