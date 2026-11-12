'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { SettingDefinition, SettingOption, SettingType } from '@/shared/types/builder'
import {
  getActiveSellerTheme,
  getSellerTheme,
  getSellerThemeSchema,
  getSellerThemeSettings,
  updateSellerThemeSettings,
  type SellerActiveTheme,
  type SellerTheme,
  type SellerThemeSetting,
  type SellerThemeSettingInput,
} from '@/lib/seller/resource-client'

const TRUTHY = new Set(['1', 'true', 'on', 'yes'])

function themeName(theme: SellerActiveTheme): string {
  if (theme.theme?.name) return theme.theme.name
  if (typeof theme.theme_name === 'string') return theme.theme_name
  if (theme.theme_name && typeof theme.theme_name === 'object') {
    return theme.theme_name.en || theme.theme_name.ar || theme.theme?.handle || ''
  }
  return theme.theme?.handle ?? theme.theme_ulid ?? ''
}

function valueToText(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (value && typeof value === 'object') {
    const localized = value as { en?: unknown; ar?: unknown }
    if (typeof localized.en === 'string') return localized.en
    if (typeof localized.ar === 'string') return localized.ar
  }
  return ''
}

/**
 * `GET /subscriber/theme` (live) does not include saved overrides, so the
 * settings form must read them from `GET /subscriber/theme/settings`. Tolerate
 * the shapes we have seen: `{settings:[{key,value}]}`, `{settings:{k:v}}`,
 * a bare array, or a flat key/value map.
 */
function settingsMapFrom(value: unknown): Record<string, string> {
  const map: Record<string, string> = {}

  const acceptEntry = (entry: unknown) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return
    const record = entry as Record<string, unknown>
    if (typeof record.key !== 'string' || !('value' in record)) return
    map[record.key] = valueToText(record.value)
  }

  const acceptMap = (record: Record<string, unknown>) => {
    for (const [key, raw] of Object.entries(record)) {
      if (
        key === 'theme' ||
        key === 'settings' ||
        key === 'has_unpublished_changes' ||
        key === 'published_at'
      ) {
        continue
      }
      if (raw && typeof raw === 'object' && 'value' in (raw as Record<string, unknown>)) {
        map[key] = valueToText((raw as Record<string, unknown>).value)
      } else {
        map[key] = valueToText(raw)
      }
    }
  }

  if (Array.isArray(value)) {
    value.forEach(acceptEntry)
    return map
  }
  if (!value || typeof value !== 'object') return map

  const record = value as Record<string, unknown>
  if (Array.isArray(record.settings)) {
    record.settings.forEach(acceptEntry)
    return map
  }
  if (record.settings && typeof record.settings === 'object') {
    acceptMap(record.settings as Record<string, unknown>)
    return map
  }
  if (record.data && typeof record.data === 'object' && !Array.isArray(record.data)) {
    return settingsMapFrom(record.data)
  }
  acceptMap(record)
  return map
}

const SETTING_TYPE_BY_LABEL: Record<string, SettingType> = {
  color: 'color',
  font: 'font',
  range: 'range',
  number: 'number',
  text: 'text',
  textarea: 'textarea',
  richtext: 'richtext',
  toggle: 'toggle',
  boolean: 'toggle',
  select: 'select',
  image: 'image',
  url: 'url',
  product: 'product',
  productlist: 'product_list',
}

function normalizeTypeToken(value: string): string {
  return value.toLowerCase().replace(/[\s_-]+/g, '')
}

function settingTypeFrom(value: SellerThemeSetting['type']): SettingType {
  if (typeof value === 'string') {
    return SETTING_TYPE_BY_LABEL[normalizeTypeToken(value)] ?? 'text'
  }
  if (value && typeof value === 'object' && typeof value.label === 'string') {
    return SETTING_TYPE_BY_LABEL[normalizeTypeToken(value.label)] ?? 'text'
  }
  return 'text'
}

function settingOptions(value: SellerThemeSetting['options']): SettingOption[] | undefined {
  if (!Array.isArray(value)) return undefined
  const options = value
    .map((option) => {
      if (typeof option === 'string') return { value: option, label: option }
      if (!option || typeof option !== 'object') return null
      const record = option as { value?: unknown; label?: unknown }
      const optionValue = valueToText(record.value)
      if (optionValue === '') return null
      return { value: optionValue, label: valueToText(record.label) || optionValue }
    })
    .filter((option): option is SettingOption => option !== null)
  return options.length > 0 ? options : undefined
}

/** Legacy themes only expose settings definitions through `GET /themes/{ulid}`. */
function definitionsFromTheme(theme: SellerTheme): SettingDefinition[] {
  return (theme.settings ?? []).map((setting) => ({
    key: setting.key,
    type: settingTypeFrom(setting.type),
    label: setting.label ?? setting.key,
    help: null,
    default: setting.default_value as SettingDefinition['default'],
    translatable: false,
    required: false,
    min: null,
    max: null,
    step: null,
    options: settingOptions(setting.options),
  }))
}

function defaultToText(definition: SettingDefinition): string {
  const value = definition.default
  if (definition.type === 'toggle') return value === true ? '1' : '0'
  if (definition.type === 'range' || definition.type === 'number') {
    if (typeof value === 'number') return String(value)
    if (typeof value === 'string' && value.trim() !== '') return value
    return String(definition.min ?? 0)
  }
  return valueToText(value)
}

function currentValue(
  theme: SellerActiveTheme | null,
  saved: Record<string, string>,
  definition: SettingDefinition,
): string {
  if (definition.key in saved) return saved[definition.key]

  const settings = theme?.settings
  if (Array.isArray(settings)) {
    const match = settings.find((setting) => setting.key === definition.key)
    if (match) {
      const text = valueToText(match.value)
      if (text !== '') return text
      const fallback = valueToText(match.default_value)
      if (fallback !== '') return fallback
    }
  } else if (settings && typeof settings === 'object') {
    const text = valueToText((settings as Record<string, unknown>)[definition.key])
    if (text !== '') return text
  }
  return defaultToText(definition)
}

function buildValues(
  theme: SellerActiveTheme | null,
  saved: Record<string, string>,
  definitions: SettingDefinition[],
): Record<string, string> {
  return Object.fromEntries(
    definitions.map((definition) => [definition.key, currentValue(theme, saved, definition)]),
  )
}

export function SellerThemeSettingsClient({
  revision = 0,
}: {
  revision?: number
} = {}) {
  const t = useTranslations('seller.theme.settings')
  const [theme, setTheme] = useState<SellerActiveTheme | null>(null)
  const [definitions, setDefinitions] = useState<SettingDefinition[]>([])
  const [fonts, setFonts] = useState<string[]>([])
  const [values, setValues] = useState<Record<string, string>>({})
  const [initial, setInitial] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [notActivated, setNotActivated] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    setNotActivated(false)
    const [themeResult, schemaResult, settingsResult] = await Promise.all([
      getActiveSellerTheme(),
      getSellerThemeSchema(),
      getSellerThemeSettings(),
    ])

    if (!themeResult.ok) {
      setLoading(false)
      if (themeResult.errorCode === 'theme_not_activated' || themeResult.status === 404) {
        setNotActivated(true)
        setTheme(null)
        setDefinitions([])
        return
      }
      setError(themeResult.message)
      return
    }

    const active = themeResult.data
    if (!active) {
      setLoading(false)
      setNotActivated(true)
      setTheme(null)
      setDefinitions([])
      return
    }
    const saved = settingsResult.ok ? settingsMapFrom(settingsResult.data) : {}
    const activeUlid = active.theme?.ulid ?? active.theme_ulid
    // `/theme/schema` describes the active theme's manifest. If it still points
    // at another theme (common for legacy themes) its settings do not belong to
    // the active theme.
    const schemaThemeUlid = schemaResult.ok ? schemaResult.data.theme?.ulid : undefined
    const schemaMatchesActive = !schemaThemeUlid || !activeUlid || schemaThemeUlid === activeUlid
    let nextDefinitions =
      schemaResult.ok && schemaMatchesActive ? schemaResult.data.settings ?? [] : []
    const nextFonts = schemaResult.ok ? schemaResult.data.fonts ?? [] : []

    // Legacy themes have no manifest, so `/theme/schema` may be empty or
    // unavailable. Their flat settings live on `GET /themes/{ulid}`.
    if (nextDefinitions.length === 0 && activeUlid) {
      const detail = await getSellerTheme(activeUlid)
      if (detail.ok) {
        nextDefinitions = definitionsFromTheme(detail.data)
        for (const setting of detail.data.settings ?? []) {
          if (setting.key in saved) continue
          const text = valueToText(setting.value)
          if (text !== '') saved[setting.key] = text
        }
      }
    }

    const nextValues = buildValues(active, saved, nextDefinitions)
    setLoading(false)
    setTheme(active)
    setDefinitions(nextDefinitions)
    setFonts(nextFonts)
    setValues(nextValues)
    setInitial(nextValues)
    if (!schemaResult.ok && nextDefinitions.length === 0) setError(schemaResult.message)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [load, revision])

  const dirty = useMemo(
    () => Object.keys(values).some((key) => values[key] !== initial[key]),
    [values, initial],
  )

  const updateValue = (key: string, value: string) => {
    setValues((current) => ({ ...current, [key]: value }))
    setMessage('')
    setError('')
  }

  const save = async () => {
    if (definitions.length === 0) return
    setSaving(true)
    setMessage('')
    setError('')
    const settings: SellerThemeSettingInput[] = definitions.map((definition) => ({
      key: definition.key,
      value: values[definition.key] ?? '',
    }))
    const result = await updateSellerThemeSettings(settings)
    setSaving(false)
    if (!result.ok) {
      setError(result.message)
      return
    }
    if (result.data) setTheme(result.data)
    // `PUT /subscriber/theme/settings` may echo normalised values back; prefer
    // them over the local form state when present.
    const savedFromResponse = settingsMapFrom(result.data)
    if (Object.keys(savedFromResponse).length > 0) {
      const nextValues = buildValues(result.data ?? theme, savedFromResponse, definitions)
      setValues(nextValues)
      setInitial(nextValues)
    } else {
      setInitial(values)
    }
    setMessage(t('saved'))
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">{t('loading')}</p>
  }

  if (notActivated || (!theme && !error)) {
    return <p className="text-sm text-muted-foreground">{t('noActiveTheme')}</p>
  }

  if (error && !theme) {
    return <p className="text-sm text-destructive">{error}</p>
  }

  if (!theme) {
    return <p className="text-sm text-muted-foreground">{t('noActiveTheme')}</p>
  }

  return (
    <section className="space-y-4 rounded-lg border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-medium">{t('title')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('description', { theme: themeName(theme) || '—' })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {theme.theme?.version && (
            <span className="rounded-full border px-2 py-0.5 text-muted-foreground">v{theme.theme.version}</span>
          )}
          {theme.has_unpublished_changes && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
              {t('unpublished')}
            </span>
          )}
        </div>
      </div>

      {message && (
        <p role="status" className="text-sm text-emerald-600 dark:text-emerald-400">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {definitions.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('empty')}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {definitions.map((definition) => (
            <ThemeSettingField
              key={definition.key}
              definition={definition}
              value={values[definition.key] ?? ''}
              fonts={fonts}
              onChange={(value) => updateValue(definition.key, value)}
            />
          ))}
        </div>
      )}

      <Button
        className="gap-2"
        disabled={saving || definitions.length === 0 || !dirty}
        onClick={() => void save()}
      >
        <Save className="size-4" />
        {saving ? t('saving') : t('save')}
      </Button>
    </section>
  )
}

function ThemeSettingField({
  definition,
  value,
  fonts,
  onChange,
}: {
  definition: SettingDefinition
  value: string
  fonts: string[]
  onChange: (value: string) => void
}) {
  const id = `theme-setting-${definition.key}`
  const label = definition.label || definition.key
  const help = definition.help ? <p className="text-xs text-muted-foreground">{definition.help}</p> : null

  if (definition.type === 'toggle') {
    return (
      <label htmlFor={id} className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm">
        <span className="font-medium">{label}</span>
        <input
          id={id}
          type="checkbox"
          checked={TRUTHY.has(value.toLowerCase())}
          onChange={(event) => onChange(event.target.checked ? '1' : '0')}
          className="size-4 accent-primary"
        />
      </label>
    )
  }

  if (definition.type === 'color') {
    const color = /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000'
    return (
      <div className="space-y-1">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <div className="flex items-center gap-2">
          <input
            id={id}
            type="color"
            value={color}
            onChange={(event) => onChange(event.target.value)}
            className="h-8 w-12 cursor-pointer rounded border bg-background"
          />
          <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder="#000000" maxLength={500} />
        </div>
        {help}
      </div>
    )
  }

  if (definition.type === 'select' || definition.type === 'font') {
    const options = definition.options?.length
      ? definition.options
      : fonts.map((font) => ({ value: font, label: font }))
    return (
      <div className="space-y-1">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-8 w-full rounded-lg border bg-background px-2 text-sm"
        >
          {value === '' && <option value="">—</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {help}
      </div>
    )
  }

  if (definition.type === 'range') {
    const min = definition.min ?? 0
    const max = definition.max ?? 100
    const step = definition.step ?? 1
    const numeric = Number(value)
    const current = Number.isFinite(numeric) ? numeric : min
    return (
      <div className="space-y-1">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <div className="flex items-center gap-3">
          <input
            id={id}
            type="range"
            min={min}
            max={max}
            step={step}
            value={current}
            onChange={(event) => onChange(event.target.value)}
            className="flex-1 accent-primary"
          />
          <Input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="w-20"
          />
        </div>
        {help}
      </div>
    )
  }

  if (definition.type === 'number') {
    return (
      <div className="space-y-1">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <Input
          id={id}
          type="number"
          min={definition.min ?? undefined}
          max={definition.max ?? undefined}
          step={definition.step ?? 1}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        {help}
      </div>
    )
  }

  if (definition.type === 'textarea' || definition.type === 'richtext') {
    return (
      <div className="space-y-1 md:col-span-2">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <Textarea id={id} value={value} onChange={(event) => onChange(event.target.value)} rows={3} maxLength={10000} />
        {help}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <Input
        id={id}
        type={definition.type === 'url' ? 'url' : 'text'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={2000}
      />
      {help}
    </div>
  )
}
