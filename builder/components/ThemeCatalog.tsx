'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Archive, LoaderCircle, Palette, Pencil, Plus, Send, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  adminThemeApi,
  type AdminTheme,
  type AdminThemeCreatePayload,
  type AdminThemeSettingInput,
} from '@/lib/admin/theme-client'

const SETTING_TYPES = [1, 2, 3, 4, 5] as const
const LOCALES = ['ar', 'en'] as const

function emptyPayload(): AdminThemeCreatePayload {
  return {
    slug: '',
    preview_url: '',
    translations: LOCALES.map((locale) => ({ locale, name: '', description: '' })),
    settings: [],
  }
}

export function ThemeCatalog() {
  const t = useTranslations('admin.themeBuilder')
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<AdminTheme | 'new' | null>(null)
  const [payload, setPayload] = useState<AdminThemeCreatePayload>(emptyPayload)
  const [error, setError] = useState<string | null>(null)
  const themesQuery = useQuery({
    queryKey: ['admin-themes'],
    queryFn: async () => {
      const result = await adminThemeApi.list('?per_page=100')
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
  })
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ['admin-themes'] })
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing === 'new') {
        const result = await adminThemeApi.create(payload)
        if (!result.ok) throw new Error(result.message)
        return result.data
      }
      const result = await adminThemeApi.update(editing?.ulid ?? '', {
        preview_url: payload.preview_url || null,
      })
      if (!result.ok) throw new Error(result.message)
      return result.data
    },
    onSuccess: () => {
      setEditing(null)
      setError(null)
      refresh()
    },
    onError: (cause) => setError(cause instanceof Error ? cause.message : t('saveError')),
  })
  const actionMutation = useMutation({
    mutationFn: async ({ type, theme }: { type: 'archive' | 'publish' | 'delete'; theme: AdminTheme }) => {
      const result = type === 'archive'
        ? await adminThemeApi.archive(theme.ulid)
        : type === 'publish'
          ? await adminThemeApi.publish(theme.ulid)
          : await adminThemeApi.remove(theme.ulid)
      if (!result.ok) throw new Error(result.message)
    },
    onSuccess: refresh,
    onError: (cause) => setError(cause instanceof Error ? cause.message : t('actionError')),
  })

  const openCreate = () => {
    setPayload(emptyPayload())
    setError(null)
    setEditing('new')
  }
  const openEdit = (theme: AdminTheme) => {
    setPayload({
      slug: theme.slug,
      preview_url: theme.preview_url ?? '',
      translations: LOCALES.map((locale) => ({
        locale,
        name: locale === 'en' ? theme.name : '',
        description: locale === 'en' ? theme.description ?? '' : '',
      })),
      settings: [],
    })
    setError(null)
    setEditing(theme)
  }
  const updateSetting = (index: number, patch: Partial<AdminThemeSettingInput>) =>
    setPayload((current) => ({
      ...current,
      settings: current.settings?.map((setting, settingIndex) =>
        settingIndex === index ? { ...setting, ...patch } : setting,
      ),
    }))
  const updateTranslation = (locale: string, patch: { name?: string; description?: string }) =>
    setPayload((current) => ({
      ...current,
      translations: current.translations.map((translation) =>
        translation.locale === locale ? { ...translation, ...patch } : translation,
      ),
    }))

  if (themesQuery.isLoading) return <div className="flex items-center justify-center p-12 text-muted-foreground"><LoaderCircle className="me-2 size-5 animate-spin" />{t('loading')}</div>
  if (themesQuery.isError) return <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center text-destructive">{themesQuery.error.message}</div>
  const themes = themesQuery.data ?? []
  const creating = editing === 'new'
  const canSave = creating
    ? payload.slug.trim().length > 0 && payload.translations.some((translation) => translation.name.trim())
    : true

  return <div className="flex flex-col gap-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-xl font-semibold">{t('title')}</h1><p className="mt-1 text-sm text-muted-foreground">{t('adminDescription')}</p></div><Button className="gap-2" onClick={openCreate}><Plus className="size-4" />{t('create')}</Button></div>
    {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
    {themes.length === 0 ? <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">{t('empty')}</div> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{themes.map((theme) => <Card key={theme.ulid}>
      <div className="flex h-32 items-center justify-center bg-muted/60" style={theme.preview_url ? { backgroundImage: `url(${theme.preview_url})`, backgroundPosition: 'center', backgroundSize: 'cover' } : undefined}>{!theme.preview_url && <Palette className="size-10 text-muted-foreground/60" />}</div>
      <CardHeader><div className="flex items-start justify-between gap-2"><CardTitle>{theme.name || theme.slug}</CardTitle><Badge variant="outline">{theme.status.label}</Badge></div><CardDescription>{theme.description || t('noDescription')}</CardDescription></CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span>{t('settingsCount', { count: theme.settings?.length ?? 0 })}</span>{theme.version && <Badge variant="secondary">v{theme.version}</Badge>}{theme.has_manifest === false && <Badge variant="outline">{t('noManifest')}</Badge>}</CardContent>
      <CardFooter className="flex flex-wrap gap-2"><Button size="sm" variant="outline" className="gap-1.5" onClick={() => openEdit(theme)}><Pencil className="size-3.5" />{t('edit')}</Button><Button size="sm" variant="outline" className="gap-1.5" disabled={actionMutation.isPending} onClick={() => actionMutation.mutate({ type: 'publish', theme })}><Send className="size-3.5" />{t('publish')}</Button><Button size="sm" variant="ghost" className="gap-1.5" disabled={actionMutation.isPending} onClick={() => actionMutation.mutate({ type: 'archive', theme })}><Archive className="size-3.5" />{t('archive')}</Button><Button size="icon-sm" variant="ghost" className="text-destructive" disabled={actionMutation.isPending} aria-label={t('delete')} onClick={() => { if (window.confirm(t('deleteConfirm'))) actionMutation.mutate({ type: 'delete', theme }) }}><Trash2 /></Button></CardFooter>
    </Card>)}</div>}
    <Dialog open={editing !== null} onOpenChange={(open) => { if (!open && !saveMutation.isPending) setEditing(null) }}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{creating ? t('createTitle') : t('editTitle')}</DialogTitle></DialogHeader><div className="grid gap-4">
      <label className="grid gap-1.5 text-sm font-medium">{t('slug')}<Input value={payload.slug} disabled={!creating} onChange={(event) => setPayload({ ...payload, slug: event.target.value })} maxLength={160} /></label>
      <label className="grid gap-1.5 text-sm font-medium">{t('previewUrl')}<Input value={payload.preview_url ?? ''} onChange={(event) => setPayload({ ...payload, preview_url: event.target.value })} placeholder="https://" /></label>
      {!creating && <p className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">{t('editLimited')}</p>}
      {creating && <div className="grid gap-4 rounded-lg border p-3"><p className="text-sm font-medium">{t('translations')}</p>{LOCALES.map((locale) => { const translation = payload.translations.find((item) => item.locale === locale); return <div key={locale} className="grid gap-2"><p className="text-xs font-semibold uppercase text-muted-foreground">{locale}</p><label className="grid gap-1.5 text-sm">{t('name')}<Input value={translation?.name ?? ''} onChange={(event) => updateTranslation(locale, { name: event.target.value })} maxLength={200} /></label><label className="grid gap-1.5 text-sm">{t('descriptionLabel')}<Textarea value={translation?.description ?? ''} onChange={(event) => updateTranslation(locale, { description: event.target.value })} /></label></div> })}</div>}
      {creating && <div className="grid gap-3 rounded-lg border p-3"><div className="flex items-center justify-between"><p className="text-sm font-medium">{t('settings')}</p><Button type="button" size="sm" variant="outline" onClick={() => setPayload({ ...payload, settings: [...(payload.settings ?? []), { key: '', type: 1, default_value: '', options: '', sort_order: payload.settings?.length ?? 0 }] })}><Plus className="me-1 size-3.5" />{t('addSetting')}</Button></div>{(payload.settings ?? []).map((setting, index) => <div key={`${index}-${setting.key}`} className="grid gap-2 rounded-md bg-muted/40 p-2 md:grid-cols-[1.3fr_0.7fr_1fr_1fr_auto]"><Input aria-label={t('settingKey')} placeholder={t('settingKey')} value={setting.key} onChange={(event) => updateSetting(index, { key: event.target.value })} /><select aria-label={t('settingType')} className="h-8 rounded-lg border bg-background px-2 text-sm" value={setting.type} onChange={(event) => updateSetting(index, { type: Number(event.target.value) })}>{SETTING_TYPES.map((type) => <option key={type} value={type}>{t(`settingTypes.${type}`)}</option>)}</select><Input aria-label={t('defaultValue')} placeholder={t('defaultValue')} value={setting.default_value ?? ''} onChange={(event) => updateSetting(index, { default_value: event.target.value })} /><Input aria-label={t('options')} placeholder={t('options')} value={setting.options ?? ''} onChange={(event) => updateSetting(index, { options: event.target.value })} /><Button type="button" size="icon-sm" variant="ghost" className="text-destructive" aria-label={t('removeSetting')} onClick={() => setPayload({ ...payload, settings: payload.settings?.filter((_, settingIndex) => settingIndex !== index) })}><Trash2 /></Button></div>)}</div>}
    </div><DialogFooter><Button variant="outline" onClick={() => setEditing(null)} disabled={saveMutation.isPending}>{t('cancel')}</Button><Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !canSave}>{saveMutation.isPending ? t('saving') : t('save')}</Button></DialogFooter></DialogContent></Dialog>
  </div>
}
