'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Copy, ExternalLink, LoaderCircle, RotateCcw, Send } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { BuilderApiError, subscriberThemeApi } from '@/api/client'
import { useEditorStore } from '@/builder/store/editor-store'

export function PublishControls({ flush, onPreviewToken }: { flush: () => Promise<void>; onPreviewToken: (token: string | null) => void }) {
  const locale = useLocale() === 'ar' ? 'ar' : 'en'
  const t = useTranslations('admin.themeBuilder')
  const queryClient = useQueryClient()
  const page = useEditorStore((state) => state.page)
  const resetDirty = useEditorStore((state) => state.resetDirty)
  const [dialog, setDialog] = useState<'publish' | 'discard' | null>(null)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const preview = useMutation({ mutationFn: async () => { await flush(); return subscriberThemeApi.createPreviewToken(locale, page.ulid) }, onSuccess: (response) => { const token = response.data?.token ?? null; onPreviewToken(token); setShareUrl(token ? `${window.location.origin}/${locale}/preview?token=${encodeURIComponent(token)}` : null) } })
  const publish = useMutation({ mutationFn: async () => { await flush(); return subscriberThemeApi.publish(locale, page.ulid) }, onSuccess: () => { resetDirty(); setDialog(null) } })
  const discard = useMutation({ mutationFn: async () => subscriberThemeApi.discard(locale, page.ulid), onSuccess: async (response) => { resetDirty(); setDialog(null); await queryClient.invalidateQueries({ queryKey: ['builder-draft', locale, page.ulid] }); if (response.data) useEditorStore.getState().setPage(response.data) } })
  const error = publish.error ?? discard.error ?? preview.error
  return <div className="flex flex-wrap items-center gap-2"><Button variant="outline" size="sm" className="gap-1.5" disabled={preview.isPending} onClick={() => preview.mutate()}>{preview.isPending ? <LoaderCircle className="size-4 animate-spin" /> : <ExternalLink className="size-4" />}{t('previewDraft')}</Button><Button variant="outline" size="sm" className="gap-1.5" disabled={discard.isPending} onClick={() => setDialog('discard')}><RotateCcw className="size-4" />{t('discard')}</Button><Button size="sm" className="gap-1.5" disabled={publish.isPending} onClick={() => setDialog('publish')}><Send className="size-4" />{publish.isPending ? t('publishing') : t('publish')}</Button>{shareUrl && <Button variant="ghost" size="icon-sm" aria-label={t('copyPreviewLink')} onClick={() => void navigator.clipboard.writeText(shareUrl)}><Copy /></Button>}{error && <span className="text-xs text-destructive">{error instanceof BuilderApiError && error.code === 'tenant_not_ready' ? t('storeUnavailable') : t('publishError')}</span>}<AlertDialog open={dialog === 'publish'} onOpenChange={(open) => { if (!open) setDialog(null) }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t('publishConfirmTitle')}</AlertDialogTitle><AlertDialogDescription>{t('publishConfirmDescription')}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={publish.isPending}>{t('cancel')}</AlertDialogCancel><AlertDialogAction disabled={publish.isPending} onClick={() => publish.mutate()}>{publish.isPending ? t('publishing') : t('publish')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog><AlertDialog open={dialog === 'discard'} onOpenChange={(open) => { if (!open) setDialog(null) }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t('discardConfirmTitle')}</AlertDialogTitle><AlertDialogDescription>{t('discardConfirmDescription')}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={discard.isPending}>{t('cancel')}</AlertDialogCancel><AlertDialogAction disabled={discard.isPending} onClick={() => discard.mutate()}>{discard.isPending ? t('discarding') : t('discard')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div>
}
