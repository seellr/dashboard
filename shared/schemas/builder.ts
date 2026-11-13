import { z } from 'zod'

const localizedValueSchema = z.object({ ar: z.string(), en: z.string() })

/** The API localizes labels for us, but older docs show `{ ar, en }` objects. */
const textualLabelSchema = z.union([z.string(), localizedValueSchema])

const settingValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.record(z.string(), z.unknown()),
  z.array(z.unknown()),
])

function labelToString(value: unknown, fallback: string): string {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') {
    const localized = value as { ar?: unknown; en?: unknown }
    if (typeof localized.en === 'string' && localized.en) return localized.en
    if (typeof localized.ar === 'string' && localized.ar) return localized.ar
  }
  return fallback
}

const settingOptionSchema = z
  .object({
    value: z.union([z.string(), z.number()]).transform((value) => String(value)),
    label: textualLabelSchema.optional(),
  })
  .transform((option) => ({
    value: option.value,
    label: labelToString(option.label, option.value),
  }))

const settingDefinitionSchema = z
  .object({
    key: z.string(),
    type: z.string(),
    label: textualLabelSchema.optional(),
    help: z.string().nullable().optional(),
    default: z.unknown().optional(),
    translatable: z.boolean().optional(),
    required: z.boolean().optional(),
    min: z.number().nullable().optional(),
    max: z.number().nullable().optional(),
    step: z.number().nullable().optional(),
    options: z.array(settingOptionSchema).optional(),
  })
  .transform((definition) => ({
    key: definition.key,
    type: definition.type,
    label: labelToString(definition.label, definition.key),
    help: definition.help ?? null,
    default: definition.default ?? null,
    translatable: definition.translatable ?? false,
    required: definition.required ?? false,
    min: definition.min ?? null,
    max: definition.max ?? null,
    step: definition.step ?? null,
    options: definition.options ?? [],
  }))

const blockDefinitionSchema = z.object({
  handle: z.string(),
  name: z.string(),
  limit: z.number().nullable().optional(),
  settings: z.array(settingDefinitionSchema).optional().default([]),
})

const sectionDefinitionSchema = z.object({
  handle: z.string(),
  name: z.string(),
  max_blocks: z.number().nullable().optional(),
  limit_per_page: z.number().nullable().optional(),
  page_types: z.array(z.string()).optional().default([]),
  settings: z.array(settingDefinitionSchema).optional().default([]),
  blocks: z.array(blockDefinitionSchema).optional().default([]),
})

const themeDescriptorSchema = z.object({
  ulid: z.string(),
  handle: z.string(),
  version: z.string().nullable().optional(),
  name: z.string(),
})

export const themeSchemaResponseSchema = z.object({
  theme: themeDescriptorSchema.optional(),
  settings: z.array(settingDefinitionSchema).optional().default([]),
  sections: z.array(sectionDefinitionSchema).optional().default([]),
  fonts: z.array(z.string()).optional().default([]),
  locales: z.array(z.string()).optional().default([]),
})

const localizedValueFromText = textualLabelSchema.transform((value) =>
  typeof value === 'string' ? { ar: value, en: value } : value,
)

const PAGE_TYPE_ALIASES: Record<string, string> = {
  '404': 'not_found',
  '404_not_found': 'not_found',
  notfound: 'not_found',
  productlist: 'product_list',
  thankyou: 'thank_you',
  leadmagnet: 'lead_magnet',
  one_time_offer: 'oto',
  custom_page: 'custom',
}

/**
 * The pages endpoints are undocumented. Their `type` field has been observed
 * both as a handle string and as an enum object (`{id,label}`), so normalise it
 * before validation instead of rejecting an otherwise usable page.
 */
function normalizePageToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function pageTypeFrom(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const token = normalizePageToken(value)
    if (!token) return undefined
    return PAGE_TYPE_ALIASES[token] ?? token
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as Record<string, unknown>
    for (const key of ['handle', 'slug', 'value', 'key', 'code']) {
      if (typeof record[key] === 'string') {
        const token = pageTypeFrom(record[key])
        if (token) return token
      }
    }
    for (const key of ['label', 'name', 'title']) {
      if (typeof record[key] === 'string') {
        const token = pageTypeFrom(record[key])
        if (token) return token
      }
    }
  }
  return undefined
}

function translatedTitle(record: Record<string, unknown>): { ar: string; en: string } | null {
  const translations = record.translations
  if (!translations || typeof translations !== 'object' || Array.isArray(translations)) return null
  const locales = translations as Record<string, unknown>
  const titleOf = (locale: string): string => {
    const entry = locales[locale]
    if (!entry || typeof entry !== 'object') return ''
    const title = (entry as Record<string, unknown>).title
    return typeof title === 'string' ? title : ''
  }
  const ar = titleOf('ar')
  const en = titleOf('en')
  if (!ar && !en) return null
  return { ar: ar || en, en: en || ar }
}

function pageNameObject(record: Record<string, unknown>): { ar: string; en: string } {
  // Live `GET /subscriber/pages` returns `title` plus a `translations` map.
  const translated = translatedTitle(record)
  if (translated) return translated

  const raw = record.name ?? record.title
  if (typeof raw === 'string' && raw.trim() !== '') return { ar: raw, en: raw }
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const localized = raw as Record<string, unknown>
    const ar = typeof localized.ar === 'string' ? localized.ar : ''
    const en = typeof localized.en === 'string' ? localized.en : ''
    if (ar || en) return { ar: ar || en, en: en || ar }
  }
  const fallback =
    (typeof record.type === 'string' && record.type) ||
    (typeof record.slug === 'string' && record.slug) ||
    (typeof record.ulid === 'string' && record.ulid) ||
    'Page'
  return { ar: fallback, en: fallback }
}

/**
 * Settings arrive either as a `{key: value}` map or as an array of
 * `{key, value}` rows. Both are normalised to the map the editor expects.
 */
function coerceSettingsRecord(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value
  if (Array.isArray(value)) {
    const record: Record<string, unknown> = {}
    for (const entry of value) {
      if (!entry || typeof entry !== 'object') continue
      const row = entry as Record<string, unknown>
      if (typeof row.key !== 'string') continue
      record[row.key] = 'value' in row ? row.value : row.default_value ?? null
    }
    return record
  }
  const record = value as Record<string, unknown>
  // Some payloads wrap the map: `{settings: {...}}` or `{data: {...}}`.
  for (const key of ['settings', 'data', 'values']) {
    if (record[key] && typeof record[key] === 'object' && !Array.isArray(record[key])) {
      return record[key]
    }
  }
  return record
}

/**
 * Sections/blocks may be an array or an object keyed by handle/section id.
 */
function looksLikeInstance(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const record = value as Record<string, unknown>
  return 'type' in record || 'handle' in record || 'settings' in record || 'blocks' in record
}

function coerceInstanceList(value: unknown, kind: 'handle' | 'type'): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value
  const record = value as Record<string, unknown>
  for (const key of ['sections', 'blocks', 'items']) {
    if (Array.isArray(record[key])) return record[key]
  }
  const entries = Object.entries(record).filter(([, entry]) => looksLikeInstance(entry))
  if (entries.length === 0) return value
  return entries.map(([key, entry]) => ({
    [kind]: key,
    ...(entry as Record<string, unknown>),
  }))
}

function coercePageRecord(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value
  const record = { ...(value as Record<string, unknown>) }
  if (typeof record.ulid !== 'string') {
    for (const key of ['id', 'page_ulid', 'pageUlid', 'uuid']) {
      if (typeof record[key] === 'string') {
        record.ulid = record[key]
        break
      }
    }
  }
  const type = pageTypeFrom(record.type ?? record.handle ?? record.page_type)
  if (type) record.type = type
  if (record.slug != null && typeof record.slug !== 'string') record.slug = String(record.slug)
  record.name = pageNameObject(record)
  return record
}

function looksLikePage(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const record = value as Record<string, unknown>
  return 'ulid' in record || 'type' in record || 'slug' in record || 'sections' in record
}

function unwrapPage(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value
  const record = value as Record<string, unknown>
  for (const key of ['page', 'draft', 'data']) {
    const nested = record[key]
    if (nested && typeof nested === 'object' && !Array.isArray(nested) && looksLikePage(nested)) {
      const page = { ...(nested as Record<string, unknown>) }
      // Live `GET /subscriber/pages/{ulid}/draft` returns
      // `{ page, sections }` with the sections as a sibling of `page`.
      if (page.sections === undefined || page.sections === null) {
        if (Array.isArray(record.sections)) page.sections = record.sections
        else if (record.sections && typeof record.sections === 'object') {
          page.sections = record.sections
        }
      }
      return page
    }
  }
  return value
}

function extractPageList(value: unknown, depth = 0): unknown[] | null {
  if (Array.isArray(value)) return value
  if (!value || typeof value !== 'object' || depth > 3) return null
  const record = value as Record<string, unknown>
  for (const key of ['pages', 'items', 'results', 'data']) {
    const nested = extractPageList(record[key], depth + 1)
    if (nested) return nested
  }
  // A map keyed by ULID/handle: keep the key so the coercion can recover the
  // missing `ulid`/`slug`.
  const entries = Object.entries(record)
  if (entries.length > 0 && entries.every(([, entry]) => looksLikePage(entry))) {
    return entries.map(([key, entry]) => {
      const page = entry as Record<string, unknown>
      return {
        ...page,
        ulid: typeof page.ulid === 'string' ? page.ulid : key,
        slug: page.slug ?? key,
      }
    })
  }
  return null
}

const settingsMapSchema = z.preprocess(
  coerceSettingsRecord,
  z.record(z.string(), settingValueSchema).nullable().optional(),
)

const blockInstanceSchema = z.object({
  ulid: z.string().optional(),
  id: z.string().optional(),
  type: z.string().optional(),
  handle: z.string().optional(),
  settings: settingsMapSchema,
  hidden: z.boolean().optional(),
})

const sectionInstanceSchema = z.object({
  ulid: z.string().optional(),
  id: z.string().optional(),
  type: z.string().optional(),
  handle: z.string().optional(),
  settings: settingsMapSchema,
  blocks: z.preprocess(
    (value) => coerceInstanceList(value, 'handle'),
    z.array(blockInstanceSchema).nullable().optional(),
  ),
  hidden: z.boolean().optional(),
})

const builderPageObjectSchema = z.object({
  ulid: z.string(),
  type: z.string(),
  slug: z.string().nullable().optional(),
  name: localizedValueFromText,
  sections: z.preprocess(
    (value) => coerceInstanceList(value, 'type'),
    z.array(sectionInstanceSchema).nullable().optional(),
  ),
}).transform((page) => ({
  ...page,
  sections: (page.sections ?? []).map((section, index) => ({
    ...section,
    settings: section.settings ?? {},
    // Keep the backend ULID: `PUT .../draft` matches existing sections by it.
    id: section.ulid ?? section.id ?? `section-${index}`,
    type: section.type ?? section.handle ?? 'section',
    blocks: (section.blocks ?? []).map((block, blockIndex) => ({
      ...block,
      settings: block.settings ?? {},
      id: block.ulid ?? block.id ?? `block-${index}-${blockIndex}`,
      type: block.type ?? block.handle ?? 'block',
    })),
  })),
}))

export const builderPageSchema = z.preprocess(
  (value) => coercePageRecord(unwrapPage(value)),
  builderPageObjectSchema,
)

/**
 * The list may arrive as a bare array, `{pages}`, `{items}`, `{results}`, or
 * nested under `{data}`. `extractPageList` unwraps those before validation.
 */
export const builderPageListSchema = z.preprocess(
  (value) => extractPageList(value) ?? value,
  z.array(builderPageSchema),
)
