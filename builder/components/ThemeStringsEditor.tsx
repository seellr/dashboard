'use client'

import { useMemo, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { Check, FileUp, LoaderCircle, Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { adminThemeApi, type AdminTheme } from '@/lib/admin/theme-client'

const stringsSchema = z.record(z.string(), z.string().max(2000))
type Strings = Record<string, string>
type Locale = 'ar' | 'en'

function normalizeStrings(value: unknown): Strings {
  if (Array.isArray(value)) {
    const map: Strings = {}
    for (const item of value) {
      if (!item || typeof item !== 'object') continue
      const record = item as { key?: unknown; value?: unknown }
      if (typeof record.key !== 'string') continue
      map[record.key] = typeof record.value === 'string' ? record.value : String(record.value ?? '')
    }
    return map
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        typeof entry === 'string' ? entry : String(entry ?? ''),
      ]),
    )
  }
  return {}
}

function themeLocaleId(theme: AdminTheme | null): string | number | null {
  if (!theme) return null
  return theme.id ?? theme.ulid
}

export function ThemeStringsEditor() {
  const dashboardLocale = useLocale() === 'ar' ? 'ar' : 'en'
  const t = useTranslations('admin.themeBuilder')
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [selectedUlid, setSelectedUlid] = useState<string | null>(null)
  const [targetLocale, setTargetLocale] = useState<Locale>(dashboardLocale)
  const [drafts, setDrafts] = useState<Strings>({})
  const [importData, setImportData] = useState<Strings | null>(null)
  const [error, setError] = useState<string | null>(null)

  const themesQuery = useQuery({
    queryKey: ['admin-themes'],
    queryFn: async () => {
      const result = await adminThemeApi.list('?per_page=100')
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
  })

  const themes = useMemo(() => themesQuery.data ?? [], [themesQuery.data])
  const selectedTheme = useMemo(
    () => themes.find((theme) => theme.ulid === selectedUlid) ?? themes[0] ?? null,
    [themes, selectedUlid],
  )
  const themeId = themeLocaleId(selectedTheme)

  const stringsQuery = useQuery({
    queryKey: ['admin-theme-locale-strings', themeId, targetLocale],
    queryFn: async () => {
      if (themeId === null) return {}
      const result = await adminThemeApi.getLocaleStrings(themeId, targetLocale)
      if (!result.ok) throw new Error(result.message)
      const next = normalizeStrings(result.data)
      setDrafts(next)
      return next
    },
    enabled: themeId !== null,
  })

  const invalidate = () =>
    void queryClient.invalidateQueries({
      queryKey: ['admin-theme-locale-strings', themeId, targetLocale],
    })

  const save = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      if (themeId === null) throw new Error(t('noThemes'))
      const result = await adminThemeApi.setLocaleString(themeId, targetLocale, key, value)
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
    onSuccess: invalidate,
    onError: (cause) => setError(cause instanceof Error ? cause.message : t('stringsError')),
  })

  const remove = useMutation({
    mutationFn: async (key: string) => {
      if (themeId === null) throw new Error(t('noThemes'))
      const result = await adminThemeApi.deleteLocaleString(themeId, targetLocale, key)
      if (!result.ok) throw new Error(result.message)
    },
    onSuccess: invalidate,
    onError: (cause) => setError(cause instanceof Error ? cause.message : t('stringsError')),
  })

  const importMutation = useMutation({
    mutationFn: async (strings: Strings) => {
      if (themeId === null) throw new Error(t('noThemes'))
      const result = await adminThemeApi.importLocaleStrings(themeId, targetLocale, strings)
      if (!result.ok) throw new Error(result.message)
    },
    onSuccess: () => {
      setImportData(null)
      invalidate()
    },
    onError: (cause) => setError(cause instanceof Error ? cause.message : t('stringsError')),
  })

  const entries = Object.entries(stringsQuery.data ?? drafts).sort(([a], [b]) =>
    a.localeCompare(b),
  )

  const parseImport = async (file: File) => {
    const text = await file.text()
    try {
      const parsed = stringsSchema.safeParse(JSON.parse(text) as unknown)
      if (parsed.success) {
        setImportData(parsed.data)
        setError(null)
      } else {
        setError(t('stringsError'))
      }
    } catch {
      setError(t('stringsError'))
    }
  }

  const busy = save.isPending || remove.isPending || importMutation.isPending
  const loadError = themesQuery.isError
    ? themesQuery.error.message
    : stringsQuery.isError
      ? stringsQuery.error.message
      : null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{t('stringsTitle')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('stringsDescription')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{t('selectTheme')}</span>
            <select
              value={selectedTheme?.ulid ?? ''}
              onChange={(event) => {
                setSelectedUlid(event.target.value)
                setDrafts({})
                setError(null)
              }}
              className="h-8 max-w-56 rounded-lg border bg-background px-2 text-sm"
              disabled={themes.length === 0}
            >
              {themes.length === 0 && <option value="">{t('noThemes')}</option>}
              {themes.map((theme) => (
                <option key={theme.ulid} value={theme.ulid}>
                  {theme.name || theme.slug}
                </option>
              ))}
            </select>
          </label>
          <Tabs value={targetLocale} onValueChange={(value) => setTargetLocale(value as Locale)}>
            <TabsList>
              <TabsTrigger value="ar">AR</TabsTrigger>
              <TabsTrigger value="en">EN</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            variant="outline"
            className="gap-2"
            disabled={themeId === null || busy}
            onClick={() => fileRef.current?.click()}
          >
            <FileUp className="size-4" />
            {t('importStrings')}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void parseImport(file)
              event.target.value = ''
            }}
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      {loadError && !error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {loadError}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t('stringsCount', { count: entries.length })}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {themeId === null ? (
            <p className="p-8 text-center text-sm text-muted-foreground">{t('noThemes')}</p>
          ) : themesQuery.isLoading || stringsQuery.isLoading ? (
            <div className="flex justify-center p-8">
              <LoaderCircle className="size-5 animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">{t('stringsEmpty')}</p>
          ) : (
            entries.map(([key, value]) => (
              <StringRow
                key={key}
                name={key}
                value={value}
                draft={drafts[key] ?? value}
                onChange={(next) =>
                  setDrafts((current) => ({ ...current, [key]: next }))
                }
                onSave={() => {
                  setError(null)
                  save.mutate({ key, value: drafts[key] ?? value })
                }}
                onDelete={() => {
                  if (!window.confirm(t('deleteStringConfirm', { key }))) return
                  setError(null)
                  remove.mutate(key)
                }}
                saving={busy}
              />
            ))
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={Boolean(importData)}
        onOpenChange={(open) => {
          if (!open) setImportData(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('importConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('importConfirmDescription', { count: Object.keys(importData ?? {}).length })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={importMutation.isPending}>
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={importMutation.isPending}
              onClick={() => {
                if (importData) importMutation.mutate(importData)
              }}
            >
              {importMutation.isPending ? t('importing') : t('confirmImport')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function StringRow({
  name,
  value,
  draft,
  onChange,
  onSave,
  onDelete,
  saving,
}: {
  name: string
  value: string
  draft: string
  onChange: (value: string) => void
  onSave: () => void
  onDelete: () => void
  saving: boolean
}) {
  return (
    <div className="grid gap-2 rounded-lg border p-3 md:grid-cols-[minmax(12rem,0.7fr)_minmax(0,1.5fr)_auto] md:items-center">
      <code className="break-all text-xs text-muted-foreground">{name}</code>
      <Textarea
        value={draft}
        aria-label={name}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-9"
        maxLength={2000}
      />
      <div className="flex gap-1">
        <Button
          size="icon-sm"
          aria-label="Save string"
          disabled={saving || draft === value}
          onClick={onSave}
        >
          <Check />
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Delete string"
          disabled={saving}
          onClick={onDelete}
        >
          <Trash2 />
        </Button>
      </div>
    </div>
  )
}
