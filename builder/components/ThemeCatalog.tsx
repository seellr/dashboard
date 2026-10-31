'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Eye, LoaderCircle, Palette, RefreshCw } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { BuilderApiError, subscriberThemeApi } from '@/api/client'
import type { SubscriberTheme, ThemeSummary } from '@/shared/types/builder'

function displayName(theme: ThemeSummary, locale: string): string {
  return theme.name[locale === 'ar' ? 'ar' : 'en'] || theme.name.en
}

function ErrorState({ error, onRetry, labels }: { error: unknown; onRetry: () => void; labels: ReturnType<typeof useTranslations> }) {
  const builderError = error instanceof BuilderApiError ? error : undefined
  const message = builderError?.code === 'tenant_not_ready' ? labels('storeUnavailable') : labels('loadError')
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
      <p className="font-medium">{message}</p>
      <Button variant="outline" onClick={onRetry} className="gap-2"><RefreshCw className="size-4" />{labels('retry')}</Button>
    </div>
  )
}

export function ThemeCatalog() {
  const locale = useLocale()
  const t = useTranslations('admin.themeBuilder')
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<ThemeSummary | null>(null)
  const [activateTarget, setActivateTarget] = useState<ThemeSummary | null>(null)

  const themesQuery = useInfiniteQuery({
    queryKey: ['subscriber-themes', locale],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => subscriberThemeApi.listThemes(locale === 'ar' ? 'ar' : 'en', pageParam),
    getNextPageParam: (lastPage) => lastPage.meta?.has_more ? lastPage.meta.next_cursor ?? undefined : undefined,
  })
  const activeQuery = useQuery({
    queryKey: ['subscriber-active-theme', locale],
    queryFn: () => subscriberThemeApi.getActiveTheme(locale === 'ar' ? 'ar' : 'en'),
  })
  const detailQuery = useQuery({
    queryKey: ['theme-detail', locale, selected?.ulid],
    enabled: Boolean(selected),
    queryFn: () => subscriberThemeApi.getTheme(locale === 'ar' ? 'ar' : 'en', selected?.ulid ?? ''),
  })
  const activateMutation = useMutation({
    mutationFn: (theme: ThemeSummary) => subscriberThemeApi.activate(locale === 'ar' ? 'ar' : 'en', theme.ulid),
    onSuccess: async () => {
      setActivateTarget(null)
      await queryClient.invalidateQueries({ queryKey: ['subscriber-active-theme', locale] })
    },
  })

  if (themesQuery.isLoading || activeQuery.isLoading) {
    return <div className="flex items-center justify-center p-12 text-muted-foreground"><LoaderCircle className="me-2 size-5 animate-spin" />{t('loading')}</div>
  }
  if (themesQuery.isError) return <ErrorState error={themesQuery.error} onRetry={() => void themesQuery.refetch()} labels={t} />
  if (activeQuery.isError) return <ErrorState error={activeQuery.error} onRetry={() => void activeQuery.refetch()} labels={t} />

  const themes = (themesQuery.data?.pages ?? []).flatMap((page) => page.data ?? []) as ThemeSummary[]
  const active = activeQuery.data?.data as SubscriberTheme | undefined

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
        </div>
        {active && <Badge variant="secondary" className="gap-1.5"><Check className="size-3.5" />{t('activeTheme', { name: active.theme_name[locale === 'ar' ? 'ar' : 'en'] })}</Badge>}
      </div>

      {themes.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">{t('empty')}</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {themes.map((theme) => {
              const isActive = active?.theme_ulid === theme.ulid
              return (
                <Card key={theme.ulid} className={isActive ? 'ring-2 ring-primary' : undefined}>
                  <div className="flex h-36 items-center justify-center bg-muted/60" style={theme.preview_url ? { backgroundImage: `url(${theme.preview_url})`, backgroundPosition: 'center', backgroundSize: 'cover' } : undefined}>
                    {!theme.preview_url && <Palette className="size-10 text-muted-foreground/60" />}
                  </div>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2"><CardTitle>{displayName(theme, locale)}</CardTitle>{isActive && <Badge>{t('active')}</Badge>}</div>
                    <CardDescription>{theme.description ? theme.description[locale === 'ar' ? 'ar' : 'en'] : t('noDescription')}</CardDescription>
                  </CardHeader>
                  <CardFooter className="gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelected(theme)} className="gap-1.5"><Eye className="size-4" />{t('details')}</Button>
                    <Button size="sm" disabled={isActive} onClick={() => setActivateTarget(theme)}>{isActive ? t('activated') : t('activate')}</Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
          {themesQuery.hasNextPage && <Button variant="outline" className="self-center" disabled={themesQuery.isFetchingNextPage} onClick={() => void themesQuery.fetchNextPage()}>{themesQuery.isFetchingNextPage && <LoaderCircle className="me-2 size-4 animate-spin" />}{t('loadMore')}</Button>}
        </>
      )}

      <Dialog open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelected(null) }}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{selected ? displayName(selected, locale) : ''}</DialogTitle></DialogHeader>
          {detailQuery.isLoading ? <div className="p-6 text-muted-foreground">{t('loading')}</div> : detailQuery.isError ? <ErrorState error={detailQuery.error} onRetry={() => void detailQuery.refetch()} labels={t} /> : <div className="flex flex-col gap-4"><p className="text-sm text-muted-foreground">{detailQuery.data?.data?.description ? detailQuery.data.data.description[locale === 'ar' ? 'ar' : 'en'] : t('noDescription')}</p><Button onClick={() => { if (selected) setActivateTarget(selected); setSelected(null) }}>{t('activate')}</Button></div>}
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(activateTarget)} onOpenChange={(open) => { if (!open) setActivateTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{t('confirmTitle')}</AlertDialogTitle><AlertDialogDescription>{t('confirmDescription', { name: activateTarget ? displayName(activateTarget, locale) : '' })}</AlertDialogDescription></AlertDialogHeader>
          {activateMutation.isError && <p className="text-sm text-destructive">{activateMutation.error instanceof BuilderApiError && activateMutation.error.code === 'tenant_not_ready' ? t('storeUnavailable') : t('activateError')}</p>}
          <AlertDialogFooter><AlertDialogCancel disabled={activateMutation.isPending}>{t('cancel')}</AlertDialogCancel><AlertDialogAction disabled={activateMutation.isPending} onClick={() => { if (activateTarget) activateMutation.mutate(activateTarget) }}>{activateMutation.isPending ? t('activating') : t('confirm')}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
