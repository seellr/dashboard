export type UiStringScope = 'brand' | 'theme'

export const UI_STRING_LOCALES = ['ar', 'en'] as const
export type UiStringLocale = (typeof UI_STRING_LOCALES)[number]

export type UiStringMap = Record<string, string>

export function uiStringScopePlural(scope: UiStringScope): 'brands' | 'themes' {
  return scope === 'brand' ? 'brands' : 'themes'
}

function uiStringBase(scope: UiStringScope, id: number, locale: UiStringLocale): string {
  return `/${uiStringScopePlural(scope)}/${id}/locale/${locale}`
}

export function uiStringResolvedPath(scope: UiStringScope, id: number, locale: UiStringLocale): string {
  return `${uiStringBase(scope, id, locale)}/resolved`
}

export function uiStringOverridesPath(scope: UiStringScope, id: number, locale: UiStringLocale): string {
  return `${uiStringBase(scope, id, locale)}/`
}

export function uiStringKeyPath(scope: UiStringScope, id: number, locale: UiStringLocale, key: string): string {
  return `${uiStringBase(scope, id, locale)}/${encodeURIComponent(key)}`
}

export function uiStringExportPath(scope: UiStringScope, id: number, locale: UiStringLocale): string {
  return `${uiStringBase(scope, id, locale)}/export`
}

export function uiStringImportPath(scope: UiStringScope, id: number, locale: UiStringLocale): string {
  return `${uiStringBase(scope, id, locale)}/import`
}

interface KeyValueEntry {
  key: string
  value?: unknown
}

// Resolved/overrides/export responses should be plain { key: value } maps,
// but the earlier prototype also typed /resolved as an array of entries —
// accept both and normalize to a map.
export function normalizeStringMap(data: unknown): UiStringMap {
  const map: UiStringMap = {}
  if (!data || typeof data !== 'object') return map

  if (Array.isArray(data)) {
    for (const entry of data) {
      if (!entry || typeof entry !== 'object') continue
      const { key, value } = entry as KeyValueEntry
      if (typeof key !== 'string') continue
      map[key] = typeof value === 'string' ? value : String(value ?? '')
    }
    return map
  }

  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    map[key] = typeof value === 'string' ? value : String(value ?? '')
  }
  return map
}