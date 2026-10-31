'use client'

import { useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { Check, FileUp, LoaderCircle, Trash2 } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BuilderApiError, subscriberThemeApi } from '@/api/client'
import type { Locale } from '@/shared/types/builder'

const stringsSchema = z.record(z.string(), z.string().max(2000))
type Strings = Record<string, string>

export function ThemeStringsEditor() {
  const dashboardLocale = useLocale() === 'ar' ? 'ar' : 'en'
  const t = useTranslations('admin.themeBuilder')
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [targetLocale, setTargetLocale] = useState<Locale>(dashboardLocale)
  const [drafts, setDrafts] = useState<Strings>({})
  const [importData, setImportData] = useState<Strings | null>(null)
  const stringsQuery = useQuery({ queryKey: ['theme-locale-strings', dashboardLocale, targetLocale], queryFn: async () => { const response = await subscriberThemeApi.getLocaleStrings(dashboardLocale, targetLocale); const parsed = stringsSchema.safeParse(response.data); if (!parsed.success) throw new Error('Invalid theme strings response'); setDrafts(parsed.data); return parsed.data } })
  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ['theme-locale-strings', dashboardLocale, targetLocale] })
  const save = useMutation({ mutationFn: ({ key, value }: { key: string; value: string }) => subscriberThemeApi.setLocaleString(dashboardLocale, targetLocale, key, value), onSuccess: invalidate })
  const remove = useMutation({ mutationFn: (key: string) => subscriberThemeApi.deleteLocaleString(dashboardLocale, targetLocale, key), onSuccess: invalidate })
  const importMutation = useMutation({ mutationFn: (strings: Strings) => subscriberThemeApi.importLocaleStrings(dashboardLocale, targetLocale, strings), onSuccess: () => { setImportData(null); invalidate() } })
  const entries = Object.entries(stringsQuery.data ?? drafts).sort(([a], [b]) => a.localeCompare(b))
  const parseImport = async (file: File) => { const text = await file.text(); try { const parsed = stringsSchema.safeParse(JSON.parse(text) as unknown); if (parsed.success) setImportData(parsed.data) } catch { setImportData(null) } }
  return <div className="flex flex-col gap-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-xl font-semibold">{t('stringsTitle')}</h1><p className="mt-1 text-sm text-muted-foreground">{t('stringsDescription')}</p></div><div className="flex items-center gap-2"><Tabs value={targetLocale} onValueChange={(value) => setTargetLocale(value as Locale)}><TabsList><TabsTrigger value="ar">AR</TabsTrigger><TabsTrigger value="en">EN</TabsTrigger></TabsList></Tabs><Button variant="outline" className="gap-2" onClick={() => fileRef.current?.click()}><FileUp className="size-4" />{t('importStrings')}</Button><input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void parseImport(file); event.target.value = '' }} /></div></div><Card><CardHeader><CardTitle className="text-base">{t('stringsCount', { count: entries.length })}</CardTitle></CardHeader><CardContent className="grid gap-3">{stringsQuery.isLoading ? <div className="flex justify-center p-8"><LoaderCircle className="size-5 animate-spin" /></div> : stringsQuery.isError ? <p className="text-sm text-destructive">{stringsQuery.error instanceof BuilderApiError && stringsQuery.error.code === 'tenant_not_ready' ? t('storeUnavailable') : t('stringsError')}</p> : entries.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">{t('stringsEmpty')}</p> : entries.map(([key, value]) => <StringRow key={key} name={key} value={value} draft={drafts[key] ?? value} onChange={(next) => setDrafts((current) => ({ ...current, [key]: next }))} onSave={() => save.mutate({ key, value: drafts[key] ?? value })} onDelete={() => remove.mutate(key)} saving={save.isPending || remove.isPending} />)}</CardContent></Card><AlertDialog open={Boolean(importData)} onOpenChange={(open) => { if (!open) setImportData(null) }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t('importConfirmTitle')}</AlertDialogTitle><AlertDialogDescription>{t('importConfirmDescription', { count: importData ? Object.keys(importData).length : 0 })}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{t('cancel')}</AlertDialogCancel><AlertDialogAction disabled={importMutation.isPending} onClick={() => { if (importData) importMutation.mutate(importData) }}>{importMutation.isPending ? t('importing') : t('confirmImport')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div>
}

function StringRow({ name, value, draft, onChange, onSave, onDelete, saving }: { name: string; value: string; draft: string; onChange: (value: string) => void; onSave: () => void; onDelete: () => void; saving: boolean }) {
  return <div className="grid gap-2 rounded-lg border p-3 md:grid-cols-[minmax(12rem,0.7fr)_minmax(0,1.5fr)_auto] md:items-center"><code className="break-all text-xs text-muted-foreground">{name}</code><Textarea value={draft} aria-label={name} onChange={(event) => onChange(event.target.value)} className="min-h-9" /><div className="flex gap-1"><Button size="icon-sm" aria-label="Save string" disabled={saving || draft === value} onClick={onSave}><Check /></Button><Button size="icon-sm" variant="ghost" aria-label="Delete string" disabled={saving} onClick={onDelete}><Trash2 /></Button></div></div>
}
