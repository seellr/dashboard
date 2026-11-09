'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  getActiveSellerTheme,
  updateSellerThemeSettings,
  type SellerActiveTheme,
  type SellerThemeSetting,
  type SellerThemeSettingInput,
} from '@/lib/seller/resource-client'

type SettingRow = {
  key: string
  type: number
  value: string
  default_value: string
  options: string[]
}

const TRUTHY = new Set(['1', 'true', 'on', 'yes'])

function normalizeType(type: SellerThemeSetting['type']): number {
  if (typeof type === 'number') return type
  if (typeof type === 'string' && /^\d+$/.test(type)) return Number(type)
  if (type && typeof type === 'object' && 'id' in type) {
    const id = Number((type as { id: number | string }).id)
    if (Number.isFinite(id)) return id
  }
  return 5
}

function parseOptions(options: SellerThemeSetting['options']): string[] {
  if (Array.isArray(options)) {
    return options
      .map((option) =>
        typeof option === 'string' ? option : String(option?.value ?? ''),
      )
      .filter(Boolean)
  }
  if (typeof options !== 'string' || !options.trim()) return []
  const trimmed = options.trim()
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed) as unknown
      if (Array.isArray(parsed)) {
        return parsed
          .map((option) =>
            typeof option === 'string'
              ? option
              : String((option as { value?: unknown })?.value ?? ''),
          )
          .filter(Boolean)
      }
    } catch {
      // Fall through to delimiter parsing.
    }
  }
  return trimmed
    .split(/[\n,|]/)
    .map((option) => option.trim())
    .filter(Boolean)
}

function normalizeSettings(theme: SellerActiveTheme | null): SettingRow[] {
  const raw = theme?.settings
  if (!raw) return []
  if (Array.isArray(raw)) {
    return raw
      .filter((setting) => setting && typeof setting === 'object' && setting.key)
      .map((setting) => {
        const fallback = setting.default_value ?? ''
        return {
          key: setting.key,
          type: normalizeType(setting.type),
          value: setting.value ?? fallback,
          default_value: fallback,
          options: parseOptions(setting.options),
        }
      })
  }
  return Object.entries(raw).map(([key, entry]) => ({
    key,
    type: 5,
    value: typeof entry === 'string' ? entry : String(entry ?? ''),
    default_value: '',
    options: [],
  }))
}

function themeName(theme: SellerActiveTheme): string {
  if (typeof theme.theme_name === 'string') return theme.theme_name
  if (theme.theme_name && typeof theme.theme_name === 'object') {
    return theme.theme_name.en || theme.theme_name.ar || theme.theme_ulid
  }
  return theme.theme_ulid
}

export function SellerThemeSettingsClient() {
  const t = useTranslations('seller.theme.settings')
  const [theme, setTheme] = useState<SellerActiveTheme | null>(null)
  const [rows, setRows] = useState<SettingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const result = await getActiveSellerTheme()
    setLoading(false)
    if (!result.ok) {
      setError(result.message)
      return
    }
    setTheme(result.data)
    setRows(normalizeSettings(result.data))
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  const hasChanges = useMemo(() => rows.length > 0, [rows.length])

  const updateRow = (key: string, value: string) => {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, value } : row)),
    )
    setMessage('')
    setError('')
  }

  const save = async () => {
    if (rows.length === 0) return
    setSaving(true)
    setMessage('')
    setError('')
    const settings: SellerThemeSettingInput[] = rows.map((row) => ({
      key: row.key,
      value: row.value,
    }))
    const result = await updateSellerThemeSettings(settings)
    setSaving(false)
    if (!result.ok) {
      setError(result.message)
      return
    }
    setTheme(result.data)
    setRows(normalizeSettings(result.data))
    setMessage(t('saved'))
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">{t('loading')}</p>
  }

  if (error && !theme) {
    return <p className="text-sm text-destructive">{error}</p>
  }

  if (!theme) {
    return <p className="text-sm text-muted-foreground">{t('noActiveTheme')}</p>
  }

  return (
    <section className="space-y-4 rounded-lg border p-4">
      <div>
        <h2 className="font-medium">{t('title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('description', { theme: themeName(theme) })}
        </p>
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

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('empty')}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((row) => (
            <SettingField
              key={row.key}
              row={row}
              onChange={(value) => updateRow(row.key, value)}
            />
          ))}
        </div>
      )}

      <Button
        className="gap-2"
        disabled={saving || !hasChanges}
        onClick={() => void save()}
      >
        <Save className="size-4" />
        {saving ? t('saving') : t('save')}
      </Button>
    </section>
  )
}

function SettingField({
  row,
  onChange,
}: {
  row: SettingRow
  onChange: (value: string) => void
}) {
  const label = row.key
  const id = `theme-setting-${row.key}`

  if (row.type === 3) {
    const checked = TRUTHY.has(row.value.toLowerCase())
    return (
      <label
        htmlFor={id}
        className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm"
      >
        <span className="font-medium">{label}</span>
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked ? '1' : '0')}
          className="size-4 accent-primary"
        />
      </label>
    )
  }

  if (row.type === 1) {
    const value = /^#[0-9a-fA-F]{6}$/.test(row.value) ? row.value : '#000000'
    return (
      <div className="space-y-1">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <div className="flex items-center gap-2">
          <input
            id={id}
            type="color"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="h-8 w-12 cursor-pointer rounded border bg-background"
          />
          <Input
            value={row.value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="#000000"
            maxLength={500}
          />
        </div>
      </div>
    )
  }

  if (row.type === 4 && row.options.length > 0) {
    return (
      <div className="space-y-1">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <select
          id={id}
          value={row.value}
          onChange={(event) => onChange(event.target.value)}
          className="h-8 w-full rounded-lg border bg-background px-2 text-sm"
        >
          <option value="">—</option>
          {row.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    )
  }

  if (row.type === 2 || row.value.length > 80) {
    return (
      <div className="space-y-1">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <Textarea
          id={id}
          value={row.value}
          onChange={(event) => onChange(event.target.value)}
          maxLength={500}
          rows={2}
        />
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
        value={row.value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={500}
      />
    </div>
  )
}
