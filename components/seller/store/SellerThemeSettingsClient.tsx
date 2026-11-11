'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { SettingDefinition } from '@/shared/types/builder'
import {
  getActiveSellerTheme,
  getSellerThemeSchema,
  updateSellerThemeSettings,
  type SellerActiveTheme,
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

function currentValue(theme: SellerActiveTheme | null, definition: SettingDefinition): string {
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

function buildValues(theme: SellerActiveTheme | null, definitions: SettingDefinition[]): Record<string, string> {
  return Object.fromEntries(definitions.map((definition) => [definition.key, currentValue(theme, definition)]))
}

export function SellerThemeSettingsClient() {
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
    const [themeResult, schemaResult] = await Promise.all([
      getActiveSellerTheme(),
      getSellerThemeSchema(),
    ])
    setLoading(false)

    if (!themeResult.ok) {
      if (themeResult.errorCode === 'theme_not_activated' || themeResult.status === 404) {
        setNotActivated(true)
        setTheme(null)
        setDefinitions([])
        return
      }
      setError(themeResult.message)
      return
    }

    const nextDefinitions = schemaResult.ok ? schemaResult.data.settings ?? [] : []
    const nextFonts = schemaResult.ok ? schemaResult.data.fonts ?? [] : []
    const nextValues = buildValues(themeResult.data, nextDefinitions)
    setTheme(themeResult.data)
    setDefinitions(nextDefinitions)
    setFonts(nextFonts)
    setValues(nextValues)
    setInitial(nextValues)
    if (!schemaResult.ok) setError(schemaResult.message)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

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
    setTheme(result.data)
    setInitial(values)
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
