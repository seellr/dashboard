/**
 * `GET /subscriber/theme/locale/{locale}` returns a `{ "key": "value" }` map.
 * A few older deployments answered with `[{ key, value }]`, so the dashboard
 * normalizes both shapes here and keeps the table sorted by key.
 */

export type ThemeStringLocale = 'ar' | 'en'

export const THEME_STRING_LOCALES: ReadonlyArray<{
  value: ThemeStringLocale
  label: string
}> = [
  { value: 'ar', label: 'العربية' },
  { value: 'en', label: 'English' },
]

export interface ThemeStringEntry {
  key: string
  value: string
}

export function toThemeStringEntries(value: unknown): ThemeStringEntry[] {
  const entries = new Map<string, string>()

  const push = (key: unknown, raw: unknown): void => {
    if (typeof key !== 'string') return
    const trimmed = key.trim()
    if (!trimmed) return
    const text =
      typeof raw === 'string' ? raw : raw == null ? '' : String(raw)
    entries.set(trimmed, text)
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      if (!item || typeof item !== 'object') continue
      const record = item as { key?: unknown; value?: unknown }
      push(record.key, record.value)
    }
  } else if (value && typeof value === 'object') {
    for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
      push(key, raw)
    }
  }

  return Array.from(entries, ([key, text]) => ({ key, value: text })).sort(
    (a, b) => a.key.localeCompare(b.key),
  )
}

/** `POST .../import` answers `{ imported: number }`; tolerate a missing body. */
export function readImportedCount(value: unknown): number | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const imported = (value as { imported?: unknown }).imported
  if (typeof imported !== 'number' && typeof imported !== 'string') return null
  const count = Number(imported)
  return Number.isFinite(count) ? count : null
}
