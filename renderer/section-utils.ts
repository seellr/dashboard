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

/**
 * Marks a rendered value with the setting key it comes from. The builder
 * preview resolves a click on this element back to the matching input, so any
 * text that is editable must carry the attribute. `blockId` scopes it to a
 * repeating block (hero buttons, header links, FAQ items, …).
 */
export function editKey(key: string, blockId?: string | null) {
  return blockId
    ? { 'data-setting': key, 'data-block-id': blockId }
    : { 'data-setting': key }
}
