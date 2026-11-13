'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Save, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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

function serializeSettingValue(definition: SettingDefinition, raw: string): unknown {
  if (definition.type === 'range') {
    const trimmed = raw.trim()
    if (trimmed === '') {
      if (typeof definition.default === 'number') return definition.default
      if (definition.min != null) return definition.min
      return 0
    }
    const num = Number(trimmed)
    if (Number.isFinite(num)) {
      if (definition.min != null && num < definition.min) return definition.min
      if (definition.max != null && num > definition.max) return definition.max
      return num
    }
    return definition.min ?? 0
  }

  if (definition.type === 'number') {
    const trimmed = raw.trim()
    if (trimmed === '') {
      if (typeof definition.default === 'number') return definition.default
      if (definition.required) return definition.min ?? 0
      return null
    }
    const num = Number(trimmed)
    return Number.isFinite(num) ? num : (definition.min ?? 0)
  }

  if (definition.type === 'toggle') {
    return TRUTHY.has(raw.toLowerCase())
  }

  if (definition.type === 'image' || definition.type === 'product') {
    const trimmed = raw.trim()
    return trimmed === '' ? null : trimmed
  }

  return raw
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

export interface SellerThemeSettingsClientProps {
  revision?: number
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSaved?: (theme: SellerActiveTheme) => void
  showCard?: boolean
}

export function SellerThemeSettingsClient({
  revision = 0,
  open,
  onOpenChange,
  onSaved,
  showCard = true,
}: SellerThemeSettingsClientProps = {}) {
  const t = useTranslations('seller.theme.settings')
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(nextOpen)
      }
      onOpenChange?.(nextOpen)
    },
    [isControlled, onOpenChange],
  )

  const [theme, setTheme] = useState<SellerActiveTheme | null>(null)
  const [definitions, setDefinitions] = useState<SettingDefinition[]>([])
  const [fonts, setFonts] = useState<string[]>([])
  const [values, setValues] = useState<Record<string, string>>({})
  const [initial, setInitial] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [notActivated, setNotActivated] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    setFieldErrors({})
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
    setFieldErrors((current) => {
      if (!(key in current)) return current
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  const save = async () => {
    if (definitions.length === 0) return
    setSaving(true)
    setMessage('')
    setError('')
    setFieldErrors({})

    const settingsMap: Record<string, unknown> = {}
    for (const definition of definitions) {
      settingsMap[definition.key] = serializeSettingValue(
        definition,
        values[definition.key] ?? '',
      )
    }

    const result = await updateSellerThemeSettings(settingsMap)
    setSaving(false)
    if (!result.ok) {
      setError(result.message)
      if (result.errors) {
        const nextFieldErrors: Record<string, string> = {}
        for (const [k, errs] of Object.entries(result.errors)) {
          const fieldKey = k.startsWith('settings.') ? k.replace('settings.', '') : k
          if (Array.isArray(errs) && errs.length > 0) {
            nextFieldErrors[fieldKey] = errs[0]
          }
        }
        setFieldErrors(nextFieldErrors)
      }
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
    if (result.data) {
      onSaved?.(result.data)
    } else if (theme) {
      onSaved?.(theme)
    }
  }

  const card = showCard ? (
    <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-4 text-card-foreground shadow-xs">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex size-2 rounded-full bg-emerald-500" />
          <h2 className="font-semibold">{theme ? themeName(theme) : t('title')}</h2>
          {theme?.theme?.version && (
            <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
              v{theme.theme.version}
            </span>
          )}
          {theme?.has_unpublished_changes && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
              {t('unpublished')}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {theme ? t('description', { theme: themeName(theme) || '—' }) : t('loading')}
        </p>
      </div>

      <Button
        variant="outline"
        onClick={() => handleOpenChange(true)}
        disabled={loading || notActivated || !theme}
        className="gap-2"
      >
        <SlidersHorizontal className="size-4" />
        {t('editSettings')}
      </Button>
    </section>
  ) : null

  return (
    <>
      {card}

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle>{t('title')}</DialogTitle>
            <DialogDescription>
              {theme ? t('description', { theme: themeName(theme) || '—' }) : ''}
            </DialogDescription>
            {theme && (
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                {theme.theme?.version && (
                  <span className="rounded-full border px-2 py-0.5 text-muted-foreground">
                    v{theme.theme.version}
                  </span>
                )}
                {theme.has_unpublished_changes && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                    {t('unpublished')}
                  </span>
                )}
              </div>
            )}
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {message && (
              <div
                role="status"
                className="rounded-md border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-600 dark:text-emerald-400"
              >
                {message}
              </div>
            )}
            {error && (
              <div
                role="alert"
                className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
              >
                {error}
              </div>
            )}

            {loading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">{t('loading')}</p>
            ) : notActivated || (!theme && !error) ? (
              <p className="py-8 text-center text-sm text-muted-foreground">{t('noActiveTheme')}</p>
            ) : definitions.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">{t('empty')}</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {definitions.map((definition) => (
                  <ThemeSettingField
                    key={definition.key}
                    definition={definition}
                    value={values[definition.key] ?? ''}
                    fonts={fonts}
                    error={fieldErrors[definition.key]}
                    onChange={(value) => updateValue(definition.key, value)}
                  />
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="px-6 py-4 border-t bg-muted/30 flex items-center justify-between sm:justify-between m-0 rounded-none">
            <Button
              variant="outline"
              type="button"
              disabled={saving}
              onClick={() => handleOpenChange(false)}
            >
              {t('close')}
            </Button>
            <Button
              type="button"
              className="gap-2"
              disabled={saving || definitions.length === 0 || !dirty}
              onClick={() => void save()}
            >
              <Save className="size-4" />
              {saving ? t('saving') : t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export const SellerThemeSettingsDialog = SellerThemeSettingsClient

function ThemeSettingField({
  definition,
  value,
  fonts,
  error,
  onChange,
}: {
  definition: SettingDefinition
  value: string
  fonts: string[]
  error?: string
  onChange: (value: string) => void
}) {
  const id = `theme-setting-${definition.key}`
  const label = definition.label || definition.key
  const help = definition.help ? (
    <p className="text-xs text-muted-foreground">{definition.help}</p>
  ) : null
  const errorMsg = error ? (
    <p className="text-xs text-destructive">{error}</p>
  ) : null

  if (definition.type === 'toggle') {
    return (
      <div className="space-y-1">
        <label
          htmlFor={id}
          className={`flex items-center justify-between gap-3 rounded-md border p-3 text-sm ${
            error ? 'border-destructive' : ''
          }`}
        >
          <span className="font-medium">{label}</span>
          <input
            id={id}
            type="checkbox"
            checked={TRUTHY.has(value.toLowerCase())}
            onChange={(event) => onChange(event.target.checked ? '1' : '0')}
            className="size-4 accent-primary"
          />
        </label>
        {help}
        {errorMsg}
      </div>
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
          <Input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="#000000"
            maxLength={500}
            className={error ? 'border-destructive' : ''}
          />
        </div>
        {help}
        {errorMsg}
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
          className={`h-8 w-full rounded-lg border bg-background px-2 text-sm ${
            error ? 'border-destructive' : ''
          }`}
        >
          {value === '' && <option value="">—</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {help}
        {errorMsg}
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
            className={`w-20 ${error ? 'border-destructive' : ''}`}
          />
        </div>
        {help}
        {errorMsg}
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
          className={error ? 'border-destructive' : ''}
        />
        {help}
        {errorMsg}
      </div>
    )
  }

  if (definition.type === 'textarea' || definition.type === 'richtext') {
    return (
      <div className="space-y-1 sm:col-span-2">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <Textarea
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={3}
          maxLength={10000}
          className={error ? 'border-destructive' : ''}
        />
        {help}
        {errorMsg}
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
        className={error ? 'border-destructive' : ''}
      />
      {help}
      {errorMsg}
    </div>
  )
}
