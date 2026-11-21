import type { ThemeRuntimeSettings } from '@/shared/types/builder'

const RUNTIME_KEYS = [
  'primary_color',
  'secondary_color',
  'background_color',
  'foreground_color',
  'heading_font',
  'body_font',
] as const

function valueToText(value: unknown): string | null {
  if (typeof value === 'string') return value.trim() === '' ? null : value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    // Localized values and `{ value }` wrappers both show up in this endpoint.
    const record = value as { en?: unknown; ar?: unknown; value?: unknown }
    if (typeof record.en === 'string' && record.en.trim()) return record.en
    if (typeof record.ar === 'string' && record.ar.trim()) return record.ar
    if ('value' in record) return valueToText(record.value)
  }
  return null
}

/**
 * Turns the `GET /subscriber/theme/settings` payload into the handful of CSS
 * variables the storefront renderer understands. The endpoint has been seen as
 * `{settings:[{key,value}]}`, `{settings:{k:v}}`, a bare array and a flat map,
 * so all four shapes are accepted.
 */
export function toThemeRuntimeSettings(value: unknown): ThemeRuntimeSettings {
  const values: Record<string, string> = {}

  const acceptEntry = (entry: unknown) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return
    const record = entry as Record<string, unknown>
    if (typeof record.key !== 'string') return
    const text = valueToText(record.value)
    if (text !== null) values[record.key] = text
  }

  const acceptMap = (record: Record<string, unknown>) => {
    for (const [key, raw] of Object.entries(record)) {
      const text = valueToText(raw)
      if (text !== null) values[key] = text
    }
  }

  const visit = (raw: unknown) => {
    if (Array.isArray(raw)) {
      raw.forEach(acceptEntry)
      return
    }
    if (!raw || typeof raw !== 'object') return
    const record = raw as Record<string, unknown>
    if (Array.isArray(record.settings)) {
      record.settings.forEach(acceptEntry)
      return
    }
    if (record.settings && typeof record.settings === 'object') {
      acceptMap(record.settings as Record<string, unknown>)
      return
    }
    if (record.data !== undefined) {
      visit(record.data)
      return
    }
    acceptMap(record)
  }

  visit(value)

  const settings: ThemeRuntimeSettings = {}
  for (const key of RUNTIME_KEYS) {
    const text = values[key]
    if (text) settings[key] = text
  }
  return settings
}
