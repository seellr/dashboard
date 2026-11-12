import type { Locale, LocalizedValue, SettingValue } from '@/shared/types/builder'

export function settingString(settings: Record<string, SettingValue | LocalizedValue>, key: string, fallback = ''): string {
  const value = settings[key]
  if (typeof value === 'string') return value
  return fallback
}

export function settingText(settings: Record<string, SettingValue | LocalizedValue>, key: string, locale: Locale, fallback = ''): string {
  const value = settings[key]
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    // Tolerate partial localized objects (`{ar}` / `{en}`) returned by the API.
    const localized = value as Partial<Record<Locale, unknown>>
    const text = localized[locale]
    if (typeof text === 'string') return text
  }
  return fallback
}
