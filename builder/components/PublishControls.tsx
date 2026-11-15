'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, Copy, ExternalLink, LoaderCircle, RotateCcw, Send } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
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
import { BuilderApiError, subscriberThemeApi } from '@/api/client'
import { useEditorStore } from '@/builder/store/editor-store'

export function PublishControls({
  flush,
  onPreviewToken,
}: {
  flush: () => Promise<void>
  onPreviewToken: (token: string | null) => void
}) {
  const locale = useLocale() === 'ar' ? 'ar' : 'en'
  const t = useTranslations('seller.builder')
  const queryClient = useQueryClient()
  const page = useEditorStore((state) => state.page)
  const pageFromServer = useEditorStore((state) => state.pageFromServer)
  const resetDirty = useEditorStore((state) => state.resetDirty)

  const [dialog, setDialog] = useState<'publish' | 'discard' | null>(null)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const preview = useMutation({
    mutationFn: async () => {
      await flush()
      return subscriberThemeApi.createPreviewToken(locale, page.ulid)
    },
    onSuccess: (response) => {
      const token = response.data?.token ?? null
      onPreviewToken(token)
      setShareUrl(
        token
          ? `${window.location.origin}/${locale}/preview?token=${encodeURIComponent(token)}`
          : null,
      )
    },
  })

  const publish = useMutation({
    mutationFn: async () => {
      await flush()
      return subscriberThemeApi.publish(locale, page.ulid)
    },
    onSuccess: () => {
      resetDirty()
      setDialog(null)
    },
  })

  const discard = useMutation({
    mutationFn: async () => subscriberThemeApi.discard(locale, page.ulid),
    onSuccess: async (response) => {
      resetDirty()
      setDialog(null)
      await queryClient.invalidateQueries({
        queryKey: ['builder-draft', locale, page.ulid],
      })
      if (response.data) {
        useEditorStore.getState().setPage(response.data)
      }
    },
  })

  const handleCopy = async () => {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const error = publish.error ?? discard.error ?? preview.error

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 text-xs"
        disabled={preview.isPending || !pageFromServer}
        onClick={() => preview.mutate()}
      >
        {preview.isPending ? (
          <LoaderCircle className="size-3.5 animate-spin" />
        ) : (
          <ExternalLink className="size-3.5" />
        )}
        <span>{t('previewDraft')}</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        disabled={discard.isPending || !pageFromServer}
        onClick={() => setDialog('discard')}
      >
        <RotateCcw className="size-3.5" />
        <span>{t('discard')}</span>
      </Button>

      <Button
        size="sm"
        variant="default"
        className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700"
        disabled={publish.isPending || !pageFromServer}
        onClick={() => setDialog('publish')}
      >
        {publish.isPending ? (
          <LoaderCircle className="size-3.5 animate-spin" />
        ) : (
          <Send className="size-3.5" />
        )}
        <span>{publish.isPending ? t('publishing') : t('publish')}</span>
      </Button>

      {shareUrl && (
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={t('openInNewTab')}
          title={copied ? 'Copied!' : 'Copy link'}
          onClick={() => void handleCopy()}
          className="text-muted-foreground hover:text-foreground"
        >
          {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
        </Button>
      )}

      {error && (
        <span className="text-xs text-destructive max-w-xs truncate">
          {error instanceof BuilderApiError ? error.message : 'Action failed'}
        </span>
      )}

      {/* Publish Confirmation Dialog */}
      <AlertDialog
        open={dialog === 'publish'}
        onOpenChange={(open) => {
          if (!open) setDialog(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('publishConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('publishConfirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={publish.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={publish.isPending}
              onClick={() => publish.mutate()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {publish.isPending ? t('publishing') : t('publish')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Discard Confirmation Dialog */}
      <AlertDialog
        open={dialog === 'discard'}
        onOpenChange={(open) => {
          if (!open) setDialog(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('discardConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('discardConfirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={discard.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={discard.isPending}
              onClick={() => discard.mutate()}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {discard.isPending ? t('discarding') : t('discard')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
