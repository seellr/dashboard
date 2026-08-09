'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { sileo } from 'sileo'
import { FileDown, Loader2, Search, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useActiveBrand } from '@/lib/admin/brand-context'
import {
  useDeleteUiString,
  useExportUiStrings,
  useUiStringsOverrides,
  useUiStringsResolved,
  useUpsertUiString,
} from '@/hooks/queries/useUiStrings'
import {
  normalizeStringMap,
  UI_STRING_LOCALES,
  type UiStringLocale,
  type UiStringMap,
  type UiStringScope,
} from '@/lib/admin/ui-strings'
import { useUiStringErrors } from '@/components/admin/localization/useUiStringErrors'
import { ImportStringsDialog } from '@/components/admin/localization/ImportStringsDialog'

const MAX_STRING_LENGTH = 2000

interface StringRow {
  key: string
  value: string
  overridden: boolean
}

function downloadJson(data: UiStringMap, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

function UiStringRow({
  scope,
  id,
  locale,
  item,
  errorMessage,
}: {
  scope: UiStringScope
  id: number
  locale: UiStringLocale
  item: StringRow
  errorMessage: (errorCode: string, fallback: string) => string
}) {
  const t = useTranslations('admin.localization')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(item.value)

  const upsert = useUpsertUiString(scope, id, locale)
  const revert = useDeleteUiString(scope, id, locale)

  const dir: 'rtl' | 'ltr' = locale === 'ar' ? 'rtl' : 'ltr'

  function startEditing() {
    setDraft(item.value)
    setEditing(true)
  }

  async function commit() {
    if (draft === item.value) {
      setEditing(false)
      return
    }
    if (draft.length > MAX_STRING_LENGTH) {
      sileo.error({ title: t('tooLong') })
      return
    }
    const result = await upsert.mutateAsync({ key: item.key, value: draft })
    if (!result.ok) {
      sileo.error({ title: errorMessage(result.errorCode, result.message) })
      setEditing(false)
      return
    }
    sileo.success({ title: t('saved') })
    setEditing(false)
  }

  async function handleRevert() {
    const result = await revert.mutateAsync(item.key)
    if (!result.ok) {
      sileo.error({ title: errorMessage(result.errorCode, result.message) })
      return
    }
    sileo.success({ title: t('reverted') })
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto_auto] items-center gap-3 border-b px-4 py-2.5 last:border-0 hover:bg-muted/30 transition-colors">
      <code className="truncate font-mono text-xs text-muted-foreground" title={item.key}>
        {item.key}
      </code>
      <div className="min-w-0">
        {editing ? (
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                commit()
              }
              if (e.key === 'Escape') {
                setDraft(item.value)
                setEditing(false)
              }
            }}
            dir={dir}
            maxLength={MAX_STRING_LENGTH}
            disabled={upsert.isPending}
            autoFocus
            className="h-8"
          />
        ) : (
          <button
            type="button"
            onClick={startEditing}
            dir={dir}
            title={t('editHint')}
            className="block w-full truncate rounded px-2 py-1 text-left text-sm hover:bg-accent"
          >
            {item.value || <span className="text-muted-foreground">—</span>}
          </button>
        )}
      </div>
      <Badge variant={item.overridden ? 'new' : 'outline'}>
        {item.overridden ? t('statusOverridden') : t('statusDefault')}
      </Badge>
      <div className="flex w-9 justify-end">
        {item.overridden && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleRevert}
            disabled={revert.isPending}
            title={t('revertTitle')}
          >
            {revert.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 text-destructive" />
            )}
          </Button>
        )}
      </div>
    </div>
  )
}

export function LocalizationClient() {
  const t = useTranslations('admin.localization')
  const errorMessage = useUiStringErrors()
  const { activeBrand } = useActiveBrand()

  const [scope, setScope] = useState<UiStringScope>('brand')
  const [themeId, setThemeId] = useState(1)
  const [locale, setLocale] = useState<UiStringLocale>('ar')
  const [search, setSearch] = useState('')

  const id = scope === 'brand' ? activeBrand.id : themeId

  const resolvedQuery = useUiStringsResolved(scope, id, locale)
  const overridesQuery = useUiStringsOverrides(scope, id, locale)
  const exportMutation = useExportUiStrings(scope, id, locale)

  const rows = useMemo<StringRow[]>(() => {
    const resolved = resolvedQuery.data ?? {}
    const overrides = overridesQuery.data ?? {}
    return Object.keys(resolved)
      .sort()
      .map((key) => ({
        key,
        value: resolved[key],
        overridden: Object.prototype.hasOwnProperty.call(overrides, key),
      }))
  }, [resolvedQuery.data, overridesQuery.data])

  const isLoading = resolvedQuery.isLoading || overridesQuery.isLoading

  const query = search.trim().toLowerCase()
  const filtered = query
    ? rows.filter(
      (r) => r.key.toLowerCase().includes(query) || r.value.toLowerCase().includes(query),
    )
    : rows

  async function handleExport() {
    const result = await exportMutation.mutateAsync()
    if (!result.ok) {
      sileo.error({ title: errorMessage(result.errorCode, result.message) })
      return
    }
    downloadJson(normalizeStringMap(result.data), `${scope}-${id}-${locale}-strings.json`)
    sileo.success({ title: t('exported') })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Scope switcher + locale toggle */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-md border bg-background p-0.5">
          {(['brand', 'theme'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScope(s)}
              className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${scope === s
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              {s === 'brand' ? t('scopeBrand') : t('scopeTheme')}
            </button>
          ))}
        </div>
        {/* {scope === 'theme' && (
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{t('themeIdLabel')}</span>
            <Input
              type="number"
              min={1}
              value={themeId}
              onChange={(e) => setThemeId(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="h-8 w-24"
            />
          </label>
        )} */}
        <div className="ms-auto flex gap-1 rounded-md border bg-background p-0.5">
          {UI_STRING_LOCALES.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLocale(l)}
              className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${locale === l
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              {l === 'ar' ? t('localeArabic') : t('localeEnglish')}
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="h-8 pl-9"
          />
        </div>
        <span className="text-sm text-muted-foreground">{t('count', { count: filtered.length })}</span>
        <ImportStringsDialog scope={scope} id={id} locale={locale} errorMessage={errorMessage} />
        <Button type="button" variant="outline" onClick={handleExport} disabled={exportMutation.isPending}>
          {exportMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4" />
          )}
          {t('export')}
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto_auto] items-center gap-3 border-b bg-muted/50 px-4 py-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('columnKey')}</span>
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('columnValue')}</span>
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('columnStatus')}</span>
          <span className="w-9" />
        </div>
        {isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
            {t('empty')}
          </div>
        ) : (
          <div>
            {filtered.map((item) => (
              <UiStringRow
                key={`${scope}-${id}-${locale}-${item.key}`}
                scope={scope}
                id={id}
                locale={locale}
                item={item}
                errorMessage={errorMessage}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}