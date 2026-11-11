'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  deleteSellerThemeString,
  getSellerThemeStrings,
  importSellerThemeStrings,
  updateSellerThemeString,
  type ThemeStrings,
} from '@/lib/seller/resource-client'

const LOCALES = ['ar', 'en'] as const

function toEntries(value: unknown): Array<[string, string]> {
  if (Array.isArray(value)) {
    const entries: Array<[string, string]> = []
    for (const item of value) {
      if (
        item &&
        typeof item === 'object' &&
        'key' in item &&
        typeof (item as { key?: unknown }).key === 'string'
      ) {
        const record = item as { key: string; value?: unknown }
        entries.push([
          record.key,
          typeof record.value === 'string' ? record.value : String(record.value ?? ''),
        ])
      }
    }
    return entries
  }
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
      key,
      typeof entry === 'string' ? entry : JSON.stringify(entry),
    ])
  }
  return []
}

export function SellerThemeStringsClient() {
  const t = useTranslations('seller.theme.strings')
  const [locale, setLocale] = useState<(typeof LOCALES)[number]>('ar')
  const [entries, setEntries] = useState<Array<[string, string]>>([])
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [importJson, setImportJson] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const load = useCallback(async (value: string) => {
    setLoading(true)
    const result = await getSellerThemeStrings(value)
    setLoading(false)
    if (!result.ok) {
      setMessage(result.message)
      return
    }
    const next = toEntries(result.data)
    setEntries(next)
    setDraft(Object.fromEntries(next))
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load(locale)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [load, locale])

  const saveKey = async (key: string, value: string) => {
    setBusy(true)
    setMessage('')
    const result = await updateSellerThemeString(locale, key, value)
    setBusy(false)
    if (!result.ok) {
      setMessage(result.message)
      return
    }
    setEntries((current) =>
      current.some(([entryKey]) => entryKey === key)
        ? current.map(([entryKey, entryValue]) =>
            entryKey === key ? [entryKey, value] : [entryKey, entryValue],
          )
        : [...current, [key, value]],
    )
    setDraft((current) => ({ ...current, [key]: value }))
    setMessage(t('saved'))
  }

  const removeKey = async (key: string) => {
    if (!window.confirm(t('confirmDelete', { key }))) return
    setBusy(true)
    const result = await deleteSellerThemeString(locale, key)
    setBusy(false)
    if (!result.ok) {
      setMessage(result.message)
      return
    }
    setEntries((current) => current.filter(([entryKey]) => entryKey !== key))
    setDraft((current) => {
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  const replaceAll = async () => {
    let parsed: unknown
    try {
      parsed = JSON.parse(importJson) as unknown
    } catch {
      setMessage(t('invalidJson'))
      return
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      setMessage(t('invalidJson'))
      return
    }
    if (!window.confirm(t('confirmImport', { locale }))) return
    setBusy(true)
    const result = await importSellerThemeStrings(locale, parsed as ThemeStrings)
    setBusy(false)
    if (!result.ok) {
      setMessage(result.message)
      return
    }
    setImportJson('')
    await load(locale)
    setMessage(t('imported'))
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label htmlFor="theme-locale" className="text-sm font-medium">
            {t('locale')}
          </label>
          <select
            id="theme-locale"
            value={locale}
            onChange={(event) => setLocale(event.target.value as (typeof LOCALES)[number])}
            className="h-8 rounded-lg border bg-background px-2 text-sm"
          >
            {LOCALES.map((value) => (
              <option key={value} value={value}>
                {value === 'ar' ? 'العربية' : 'English'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {message && (
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
      )}

      <div className="space-y-3 rounded-lg border p-4">
        <h2 className="font-medium">{t('overrides')}</h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">{t('loading')}</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        ) : (
          <div className="space-y-3">
            {entries.map(([key]) => (
              <div key={key} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto]">
                <code className="truncate rounded bg-muted px-2 py-1 text-xs">{key}</code>
                <Input
                  value={draft[key] ?? ''}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, [key]: event.target.value }))
                  }
                  aria-label={t('valueFor', { key })}
                />
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="outline"
                    disabled={busy}
                    aria-label={t('saveKey', { key })}
                    onClick={() => void saveKey(key, draft[key] ?? '')}
                  >
                    <Save className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    disabled={busy}
                    aria-label={t('deleteKey', { key })}
                    onClick={() => void removeKey(key)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2 rounded-lg border p-4">
        <h2 className="font-medium">{t('addTitle')}</h2>
        <div className="flex flex-wrap gap-2">
          <Input
            value={newKey}
            onChange={(event) => setNewKey(event.target.value)}
            placeholder={t('key')}
            aria-label={t('key')}
            className="max-w-xs"
          />
          <Input
            value={newValue}
            onChange={(event) => setNewValue(event.target.value)}
            placeholder={t('value')}
            aria-label={t('value')}
            className="max-w-sm"
          />
          <Button
            disabled={busy || !newKey.trim()}
            onClick={() => {
              void saveKey(newKey.trim(), newValue).then(() => {
                setNewKey('')
                setNewValue('')
              })
            }}
          >
            {t('save')}
          </Button>
        </div>
      </div>

      <div className="space-y-2 rounded-lg border p-4">
        <h2 className="font-medium">{t('importTitle')}</h2>
        <p className="text-xs text-amber-700 dark:text-amber-300">
          {t('importWarning')}
        </p>
        <Textarea
          value={importJson}
          onChange={(event) => setImportJson(event.target.value)}
          placeholder={'{ "key": "value" }'}
          aria-label={t('importJson')}
          rows={6}
        />
        <Button
          variant="outline"
          disabled={busy || !importJson.trim()}
          onClick={() => void replaceAll()}
        >
          {t('import')}
        </Button>
      </div>
    </section>
  )
}
