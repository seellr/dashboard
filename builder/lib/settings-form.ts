import { z } from 'zod'
import type { SectionInstance, SettingDefinition, SettingValue, LocalizedValue } from '@/shared/types/builder'

export function settingFieldName(definition: SettingDefinition, locale: 'ar' | 'en'): string {
  return definition.translatable ? `${definition.key}.${locale}` : definition.key
}

export function buildSettingsSchema(definitions: SettingDefinition[], locale: 'ar' | 'en') {
  const shape: Record<string, z.ZodType> = {}
  for (const definition of definitions) {
    const schema = definition.type === 'toggle' ? z.boolean() : z.string().max(2000)
    shape[settingFieldName(definition, locale)] = definition.required ? schema : schema.optional()
  }
  return z.object(shape)
}

export function flattenSettings(settings: SectionInstance['settings'], definitions: SettingDefinition[], locale: 'ar' | 'en'): Record<string, string | boolean> {
  const result: Record<string, string | boolean> = {}
  for (const definition of definitions) {
    const value = settings[definition.key]
    if (definition.translatable && typeof value === 'object' && value !== null && 'ar' in value && 'en' in value) result[settingFieldName(definition, locale)] = value[locale]
    else if (typeof value === 'string' || typeof value === 'boolean') result[definition.key] = value
    else if (typeof definition.default_value === 'string' || typeof definition.default_value === 'boolean') result[definition.key] = definition.default_value
  }
  return result
}

export function mergeSettings(values: Record<string, unknown>, existing: SectionInstance['settings'], definitions: SettingDefinition[], locale: 'ar' | 'en'): SectionInstance['settings'] {
  const result: SectionInstance['settings'] = { ...existing }
  for (const definition of definitions) {
    const field = values[settingFieldName(definition, locale)]
    if (definition.translatable) {
      const previous = result[definition.key]
      const localized: LocalizedValue = typeof previous === 'object' && previous !== null && 'ar' in previous && 'en' in previous ? { ar: previous.ar, en: previous.en } : { ar: '', en: '' }
      localized[locale] = typeof field === 'string' ? field : ''
      result[definition.key] = localized
    } else if (typeof field === 'string' || typeof field === 'boolean') result[definition.key] = field as SettingValue
  }
  return result
}
