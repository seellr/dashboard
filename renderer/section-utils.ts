import type { Locale, LocalizedValue, SettingValue } from '@/shared/types/builder'

export function settingString(settings: Record<string, SettingValue | LocalizedValue>, key: string, fallback = ''): string {
  const value = settings[key]
  if (typeof value === 'string') return value
  return fallback
}

export function settingText(settings: Record<string, SettingValue | LocalizedValue>, key: string, locale: Locale, fallback = ''): string {
  const value = settings[key]
  if (typeof value === 'object' && value !== null && 'ar' in value && 'en' in value) return value[locale] || fallback
  return typeof value === 'string' ? value : fallback
}
