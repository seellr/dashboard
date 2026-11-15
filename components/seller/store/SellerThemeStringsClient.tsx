'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sileo } from 'sileo'
import {
  AlertTriangle,
  FileJson,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { isApiFailure } from '@/lib/shared/api-result'
import {
  deleteSellerThemeString,
  getSellerThemeStrings,
  importSellerThemeStrings,
  updateSellerThemeString,
} from '@/lib/seller/resource-client'
import {
  THEME_STRING_LOCALES,
  readImportedCount,
  toThemeStringEntries,
  type ThemeStringEntry,
  type ThemeStringLocale,
} from '@/lib/seller/theme-strings'
import { ThemeStringFormDialog, type ThemeStringDraft } from './ThemeStringFormDialog'
import { ThemeStringsImportDialog } from './ThemeStringsImportDialog'

const stringsQueryKey = (locale: ThemeStringLocale) =>
  ['seller-theme-strings', locale] as const

/**
 * Endpoints backing this screen (see All.md §Theme):
 * - GET    /subscriber/theme/locale/{locale}        → `{ key: value }` map
 * - PUT    /subscriber/theme/locale/{locale}/{key}  → upsert one override
 * - DELETE /subscriber/theme/locale/{locale}/{key}  → remove one override
 * - POST   /subscriber/theme/locale/{locale}/import → replace all overrides
 *
 * TanStack Query owns the list; every mutation invalidates the active locale so
 * the table always reflects the server instead of an optimistic local guess.
 */
export function SellerThemeStringsClient() {
  const t = useTranslations('seller.theme.strings')
  const uiLocale = useLocale()
  const queryClient = useQueryClient()

  const [locale, setLocale] = useState<ThemeStringLocale>('ar')
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ThemeStringEntry | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ThemeStringEntry | null>(null)
  const [importOpen, setImportOpen] = useState(false)

  const stringsQuery = useQuery({
    queryKey: stringsQueryKey(locale),
    queryFn: () => getSellerThemeStrings(locale),
    retry: false,
    staleTime: 30_000,
  })

  const result = stringsQuery.data
  const entries = useMemo(
    () => (result?.ok ? toThemeStringEntries(result.data) : []),
    [result],
  )
  const existingKeys = useMemo(
    () => new Set(entries.map((entry) => entry.key)),
    [entries],
  )

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return entries
    return entries.filter(
      (entry) =>
        entry.key.toLowerCase().includes(term) ||
        entry.value.toLowerCase().includes(term),
    )
  }, [entries, search])

  const saveString = useMutation({
    mutationFn: (input: { locale: ThemeStringLocale; draft: ThemeStringDraft }) =>
      updateSellerThemeString(input.locale, input.draft.key, input.draft.value),
  })

  const deleteString = useMutation({
    mutationFn: (input: { locale: ThemeStringLocale; key: string }) =>
      deleteSellerThemeString(input.locale, input.key),
  })

  const importStrings = useMutation({
    mutationFn: (input: {
      locale: ThemeStringLocale
      strings: Record<string, string>
    }) => importSellerThemeStrings(input.locale, input.strings),
  })

  const canEdit = result?.ok === true

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: stringsQueryKey(locale) })
  }

  const handleSave = async (draft: ThemeStringDraft) => {
    const response = await saveString.mutateAsync({ locale, draft })
    if (!response.ok) {
      sileo.error({ title: response.message })
      return false
    }
    sileo.success({ title: t('saved') })
    await refresh()
    return true
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const response = await deleteString.mutateAsync({
      locale,
      key: deleteTarget.key,
    })
    if (!response.ok) {
      sileo.error({ title: response.message })
      return
    }
    sileo.success({ title: t('deleted') })
    setDeleteTarget(null)
    await refresh()
  }

  const handleImport = async (strings: Record<string, string>) => {
    const response = await importStrings.mutateAsync({ locale, strings })
    if (!response.ok) {
      sileo.error({ title: response.message })
      return false
    }
    const imported = readImportedCount(response.data)
    sileo.success({
      title:
        imported === null
          ? t('imported')
          : t('importedCount', { count: imported }),
    })
    await refresh()
    return true
  }

  const changeLocale = (next: ThemeStringLocale) => {
    if (next === locale) return
    setLocale(next)
    setSearch('')
    setFormOpen(false)
    setEditing(null)
    setDeleteTarget(null)
    setImportOpen(false)
  }

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (entry: ThemeStringEntry) => {
    setEditing(entry)
    setFormOpen(true)
  }

  const failure = result && isApiFailure(result) ? result : null
  const themeMissing = failure?.errorCode === 'localization_theme_not_found'

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="group"
          aria-label={t('locale')}
          className="inline-flex items-center gap-1 rounded-lg bg-muted p-[3px]"
        >
          {THEME_STRING_LOCALES.map((item) => {
            const active = item.value === locale
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => changeLocale(item.value)}
                aria-pressed={active}
                className={cn(
                  'h-7 rounded-md px-3 text-sm font-medium transition-colors',
                  active
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {item.label}
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <InputGroup className="w-full sm:w-64">
            <InputGroupAddon>
              <Search aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('searchPlaceholder')}
              aria-label={t('searchPlaceholder')}
            />
            {search ? (
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  size="icon-xs"
                  aria-label={t('clearSearch')}
                  title={t('clearSearch')}
                  onClick={() => setSearch('')}
                >
                  <X aria-hidden="true" />
                </InputGroupButton>
              </InputGroupAddon>
            ) : null}
          </InputGroup>

          <Button
            variant="outline"
            onClick={() => setImportOpen(true)}
            disabled={!canEdit}
          >
            <FileJson className="size-4" aria-hidden="true" />
            {t('import')}
          </Button>
          <Button onClick={openCreate} disabled={!canEdit}>
            <Plus className="size-4" aria-hidden="true" />
            {t('add')}
          </Button>
        </div>
      </div>

      {failure ? (
        <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4">
          <div className="flex min-w-0 items-start gap-2">
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0 text-destructive"
              aria-hidden="true"
            />
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {themeMissing ? t('themeRequiredTitle') : t('loadFailed')}
              </p>
              <p className="text-sm text-muted-foreground">
                {themeMissing ? t('themeRequiredBody') : failure.message}
              </p>
            </div>
          </div>
          {themeMissing ? (
            <Link
              href={`/${uiLocale}/seller/theme`}
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              {t('themeRequiredAction')}
            </Link>
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled={stringsQuery.isFetching}
              onClick={() => void stringsQuery.refetch()}
            >
              <RefreshCw
                className={cn('size-4', stringsQuery.isFetching && 'animate-spin')}
                aria-hidden="true"
              />
              {t('retry')}
            </Button>
          )}
        </div>
      ) : null}

      {!failure ? (
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
            <h2 className="text-sm font-medium">{t('overrides')}</h2>
            <span className="text-xs text-muted-foreground">
              {t('count', { count: filtered.length })}
            </span>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[38%]">{t('key')}</TableHead>
                <TableHead>{t('value')}</TableHead>
                <TableHead className="w-24 text-end">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stringsQuery.isPending ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton className="h-5 w-44" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-full max-w-[420px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="ms-auto h-7 w-16" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-12 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                      <FileJson
                        className="size-8 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <p className="text-sm text-muted-foreground">
                        {search ? t('noResults') : t('empty')}
                      </p>
                      {!search && canEdit ? (
                        <Button size="sm" onClick={openCreate}>
                          <Plus className="size-4" aria-hidden="true" />
                          {t('add')}
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((entry) => (
                  <TableRow key={entry.key}>
                    <TableCell className="align-top">
                      <code
                        dir="ltr"
                        title={entry.key}
                        className="block max-w-[320px] truncate rounded bg-muted px-1.5 py-0.5 text-start font-mono text-xs"
                      >
                        {entry.key}
                      </code>
                    </TableCell>
                    <TableCell className="whitespace-normal align-top">
                      <p
                        dir="auto"
                        title={entry.value}
                        className="line-clamp-2 max-w-[560px] text-sm"
                      >
                        {entry.value}
                      </p>
                    </TableCell>
                    <TableCell className="align-top text-end">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label={t('editKey', { key: entry.key })}
                          title={t('editKey', { key: entry.key })}
                          onClick={() => openEdit(entry)}
                        >
                          <Pencil aria-hidden="true" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          aria-label={t('deleteKey', { key: entry.key })}
                          title={t('deleteKey', { key: entry.key })}
                          onClick={() => setDeleteTarget(entry)}
                        >
                          <Trash2 aria-hidden="true" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      ) : null}

      <ThemeStringFormDialog
        open={formOpen}
        onOpenChange={(next) => {
          setFormOpen(next)
          if (!next) setEditing(null)
        }}
        locale={locale}
        initial={editing}
        existingKeys={existingKeys}
        onSubmit={handleSave}
      />

      <ThemeStringsImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        locale={locale}
        onImport={handleImport}
      />

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleteString.isPending) setDeleteTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteTitle')}</DialogTitle>
            <DialogDescription>
              {deleteTarget
                ? t('deleteDescription', { key: deleteTarget.key })
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={deleteString.isPending}
              onClick={() => setDeleteTarget(null)}
            >
              {t('cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteString.isPending}
              onClick={() => void handleDelete()}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              {deleteString.isPending ? t('deleting') : t('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
