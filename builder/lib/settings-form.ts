import { z } from 'zod'
import type {
  LocalizedValue,
  SectionInstance,
  SettingDefinition,
  SettingValue,
} from '@/shared/types/builder'

function isLocalized(value: unknown): value is LocalizedValue {
  if (!value || typeof value !== 'object') return false
  const candidate = value as { ar?: unknown; en?: unknown }
  return typeof candidate.ar === 'string' && typeof candidate.en === 'string'
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
  if (isLocalized(value)) return value[locale]
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
      result[name] = isLocalized(raw) ? raw[locale] : defaultValueFor(definition, locale)
      continue
    }
    if (definition.type === 'product_list') {
      result[name] = Array.isArray(raw) ? raw.map(String) : []
      continue
    }
    if (definition.type === 'image') {
      const mediaUrl = mediaUrlOf(raw)
      result[name] = mediaUrl ?? (typeof raw === 'string' ? raw : defaultValueFor(definition, locale))
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

    if (definition.translatable) {
      const previous = result[definition.key]
      const localized: LocalizedValue = isLocalized(previous)
        ? { ar: previous.ar, en: previous.en }
        : isLocalized(definition.default)
          ? { ar: definition.default.ar, en: definition.default.en }
          : { ar: '', en: '' }
      localized[locale] = typeof field === 'string' ? field : String(field ?? '')
      result[definition.key] = localized
      continue
    }

    if (definition.type === 'toggle') {
      result[definition.key] = Boolean(field)
      continue
    }
    if (definition.type === 'product_list') {
      result[definition.key] = Array.isArray(field) ? field.map(String) : []
      continue
    }
    if (isNumeric(definition.type)) {
      const numeric = typeof field === 'number' ? field : Number(field)
      result[definition.key] = Number.isFinite(numeric) ? numeric : null
      continue
    }
    if (typeof field === 'string') {
      result[definition.key] = field
    } else if (field !== undefined) {
      result[definition.key] = field as SettingValue
    }
  }
  return result
}
