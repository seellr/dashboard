import { z } from 'zod'
import type {
  LocalizedValue,
  SectionInstance,
  SettingDefinition,
  SettingValue,
} from '@/shared/types/builder'

function isLocalized(value: unknown): value is LocalizedValue {
  return localizedPair(value) !== null
}

function localizedPair(value: unknown): LocalizedValue | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const candidate = value as { ar?: unknown; en?: unknown }
  const ar = typeof candidate.ar === 'string' ? candidate.ar : ''
  const en = typeof candidate.en === 'string' ? candidate.en : ''
  if (ar === '' && en === '') return null
  return { ar, en }
}

function localizedText(value: unknown, locale: 'ar' | 'en'): string | null {
  const pair = localizedPair(value)
  if (pair) return pair[locale]
  return typeof value === 'string' ? value : null
}

function isNumeric(type: SettingDefinition['type']) {
  return type === 'number' || type === 'range'
}

/** Media settings may be stored as `{ ulid, url, thumb_url }` references. */
function mediaUrlOf(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as { url?: unknown; thumb_url?: unknown }
  if (typeof candidate.url === 'string' && candidate.url) return candidate.url
  if (typeof candidate.thumb_url === 'string' && candidate.thumb_url) return candidate.thumb_url
  return null
}

function maxLengthFor(type: SettingDefinition['type']): number {
  if (type === 'richtext') return 200_000
  if (type === 'textarea') return 20_000
  return 10_000
}

export function settingFieldName(
  definition: SettingDefinition,
  locale: 'ar' | 'en',
): string {
  return definition.translatable ? `${definition.key}.${locale}` : definition.key
}

function defaultValueFor(
  definition: SettingDefinition,
  locale: 'ar' | 'en',
): unknown {
  const value = definition.default
  if (definition.type === 'toggle') {
    return typeof value === 'boolean' ? value : false
  }
  if (definition.type === 'product_list') {
    return Array.isArray(value) ? value.map(String) : []
  }
  if (isNumeric(definition.type)) {
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
      return Number(value)
    }
    return definition.min ?? 0
  }
  if (isLocalized(value)) return localizedText(value, locale) ?? ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return mediaUrlOf(value) ?? ''
}

export function buildSettingsSchema(
  definitions: SettingDefinition[],
  locale: 'ar' | 'en',
) {
  const shape: Record<string, z.ZodType> = {}
  for (const definition of definitions) {
    let schema: z.ZodType
    if (definition.type === 'toggle') schema = z.boolean()
    else if (definition.type === 'product_list') schema = z.array(z.string())
    else schema = z.string().max(maxLengthFor(definition.type))
    shape[settingFieldName(definition, locale)] = definition.required
      ? schema
      : schema.optional()
  }
  return z.object(shape)
}

export function flattenSettings(
  settings: SectionInstance['settings'],
  definitions: SettingDefinition[],
  locale: 'ar' | 'en',
): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const definition of definitions) {
    const name = settingFieldName(definition, locale)
    const raw = settings[definition.key]

    if (definition.translatable) {
      // Only use the schema default when the section has no value at all. An
      // explicitly cleared value (`{ar: '', en: ''}`) must stay empty, otherwise
      // the field snaps back to the default and looks uneditable.
      result[name] =
        raw == null ? defaultValueFor(definition, locale) : (localizedText(raw, locale) ?? '')
      continue
    }
    if (definition.type === 'product_list') {
      result[name] = Array.isArray(raw) ? raw.map(String) : []
      continue
    }
    if (definition.type === 'image') {
      // `null` means the user cleared the image; don't re-show the schema
      // default in the picker or it looks like the clear never happened.
      if (raw === null) {
        result[name] = ''
        continue
      }
      const mediaUrl = mediaUrlOf(raw)
      result[name] = mediaUrl ?? (typeof raw === 'string' ? raw : defaultValueFor(definition, locale))
      continue
    }
    // Same for numbers: an explicitly emptied input persists as `null` and
    // should render empty rather than jumping back to the default.
    if (raw === null && isNumeric(definition.type)) {
      result[name] = ''
      continue
    }
    if (
      raw !== undefined &&
      raw !== null &&
      (typeof raw === 'string' || typeof raw === 'number' || typeof raw === 'boolean')
    ) {
      result[name] = definition.type === 'toggle' ? Boolean(raw) : String(raw)
      continue
    }
    result[name] = defaultValueFor(definition, locale)
  }
  return result
}

export function mergeSettings(
  values: Record<string, unknown>,
  existing: SectionInstance['settings'],
  definitions: SettingDefinition[],
  locale: 'ar' | 'en',
): SectionInstance['settings'] {
  const result: SectionInstance['settings'] = { ...existing }
  for (const definition of definitions) {
    const field = values[settingFieldName(definition, locale)]
    const fieldText = typeof field === 'string' ? field : field == null ? '' : String(field)
    const hasExisting = definition.key in existing && existing[definition.key] != null

    if (definition.translatable) {
      // Do not materialise empty defaults for settings the section never had.
      if (!hasExisting && fieldText === '') continue
      const previous = result[definition.key]
      const localized: LocalizedValue =
        localizedPair(previous) ??
        localizedPair(definition.default) ?? { ar: '', en: '' }
      localized[locale] = fieldText
      result[definition.key] = localized
      continue
    }

    if (definition.type === 'toggle') {
      if (!hasExisting && field === false) continue
      result[definition.key] = Boolean(field)
      continue
    }
    if (definition.type === 'product_list') {
      const next = Array.isArray(field) ? field.map(String) : []
      if (next.length === 0 && !hasExisting) continue
      result[definition.key] = next
      continue
    }
    if (definition.type === 'image') {
      // Media settings are nullable; clearing one should send `null`, not `''`.
      if (fieldText !== '') result[definition.key] = fieldText
      else if (hasExisting) result[definition.key] = null
      continue
    }
    if (isNumeric(definition.type)) {
      if (fieldText === '' && !hasExisting) continue
      const numeric = typeof field === 'number' ? field : Number(field)
      result[definition.key] = Number.isFinite(numeric) ? numeric : null
      continue
    }
    if (typeof field === 'string') {
      if (field === '' && !hasExisting) continue
      result[definition.key] = field
    } else if (field !== undefined) {
      result[definition.key] = field as SettingValue
    }
  }
  return result
}

/**
 * Apply a single edited control value. Unlike {@link mergeSettings} (which runs
 * over every flattened field), an explicit edit is always written — including
 * an empty string — so clearing a setting sticks instead of reverting to the
 * schema default on the next render.
 */
export function commitSetting(
  existing: SectionInstance['settings'],
  definition: SettingDefinition,
  value: unknown,
  locale: 'ar' | 'en',
): SectionInstance['settings'] {
  const next: SectionInstance['settings'] = { ...existing }
  const text = typeof value === 'string' ? value : value == null ? '' : String(value)

  if (definition.translatable) {
    // Some payloads store a plain string instead of `{ ar, en }`. Treat it as
    // the value for both locales (matching flattenSettings) instead of dropping
    // the other language when one side is edited.
    const existingValue = existing[definition.key]
    const pair =
      localizedPair(existingValue) ??
      (typeof existingValue === 'string'
        ? { ar: existingValue, en: existingValue }
        : { ar: '', en: '' })
    pair[locale] = text
    next[definition.key] = pair
    return next
  }
  if (definition.type === 'toggle') {
    next[definition.key] = Boolean(value)
    return next
  }
  if (definition.type === 'product_list') {
    next[definition.key] = Array.isArray(value) ? value.map(String) : []
    return next
  }
  if (definition.type === 'image') {
    // Media settings are nullable; clearing one sends `null`, not `''`.
    next[definition.key] = text === '' ? null : text
    return next
  }
  if (isNumeric(definition.type)) {
    const numeric = typeof value === 'number' ? value : Number(text)
    next[definition.key] = text === '' || !Number.isFinite(numeric) ? null : numeric
    return next
  }
  next[definition.key] = text
  return next
}
