'use client'

import { useEffect, useRef, useState } from 'react'
import {
  ExternalLink,
  LoaderCircle,
  Monitor,
  RefreshCw,
  RotateCw,
  Smartphone,
  Tablet,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { usePreviewMessaging } from '@/builder/hooks/usePreviewMessaging'
import type { BuilderPage, Locale, ThemeSchema } from '@/shared/types/builder'
import type { PreviewToEditorMessage } from '@/shared/types/preview-protocol'

type Device = 'mobile' | 'tablet' | 'desktop'
const deviceWidths: Record<Device, string> = {
  mobile: '390px',
  tablet: '768px',
  desktop: '100%',
}

interface PreviewFrameProps {
  page: BuilderPage
  schema: ThemeSchema
  locale: Locale
  selectedSectionId?: string | null
  onMessage?: (message: PreviewToEditorMessage) => void
  previewToken?: string | null
}

export function PreviewFrame({
  page,
  schema,
  locale,
  selectedSectionId,
  onMessage,
  previewToken,
}: PreviewFrameProps) {
  const t = useTranslations('seller.builder')
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [device, setDevice] = useState<Device>('desktop')
  const [ready, setReady] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const { retry } = usePreviewMessaging({
    iframeRef,
    page,
    schema,
    locale,
    selectedSectionId,
    onMessage,
    onReadyChange: setReady,
  })

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!ready) setTimedOut(true)
    }, 8000)
    return () => clearTimeout(timeout)
  }, [ready])

  const storefrontPreviewUrl = process.env.NEXT_PUBLIC_STOREFRONT_PREVIEW_URL ?? ''
  const previewUrl = storefrontPreviewUrl
    ? `${storefrontPreviewUrl.replace(/\/$/, '')}/${locale}/preview${previewToken ? `?token=${encodeURIComponent(previewToken)}` : ''}`
    : `/${locale}/preview${previewToken ? `?token=${encodeURIComponent(previewToken)}` : ''}`

  const handleRefresh = () => {
    setReady(false)
    setTimedOut(false)
    if (iframeRef.current) {
      iframeRef.current.src = previewUrl
    }
    retry()
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-2 p-3 overflow-hidden">
      {/* Top Preview Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
        <div
          className="flex items-center gap-1 rounded-lg border bg-muted/40 p-0.5"
          role="group"
          aria-label={t('desktop')}
        >
          <Button
            size="sm"
            variant={device === 'desktop' ? 'secondary' : 'ghost'}
            className="h-7 gap-1.5 px-2.5 text-xs"
            onClick={() => setDevice('desktop')}
          >
            <Monitor className="size-3.5" />
            <span className="hidden sm:inline">{t('desktop')}</span>
          </Button>
          <Button
            size="sm"
            variant={device === 'tablet' ? 'secondary' : 'ghost'}
            className="h-7 gap-1.5 px-2.5 text-xs"
            onClick={() => setDevice('tablet')}
          >
            <Tablet className="size-3.5" />
            <span className="hidden sm:inline">{t('tablet')}</span>
          </Button>
          <Button
            size="sm"
            variant={device === 'mobile' ? 'secondary' : 'ghost'}
            className="h-7 gap-1.5 px-2.5 text-xs"
            onClick={() => setDevice('mobile')}
          >
            <Smartphone className="size-3.5" />
            <span className="hidden sm:inline">{t('mobile')}</span>
          </Button>
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className="font-mono text-[11px] rounded bg-muted/60 px-1.5 py-0.5">
            {deviceWidths[device]}
          </span>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleRefresh}
            title={t('refreshPreview')}
            aria-label={t('refreshPreview')}
          >
            <RotateCw className="size-3.5" />
          </Button>
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            title={t('openInNewTab')}
            aria-label={t('openInNewTab')}
          >
            <ExternalLink className="size-3.5" />
          </a>
        </div>
      </div>

      {/* Preview Viewport Canvas */}
      <div className="relative flex flex-1 items-start justify-center overflow-auto rounded-lg bg-muted/30 p-2 sm:p-4 min-h-0">
        <div
          className={`relative h-full w-full transition-all duration-300 ease-in-out flex flex-col ${
            device === 'desktop'
              ? 'size-full rounded-lg border bg-background shadow-xs overflow-hidden'
              : device === 'tablet'
                ? 'h-[850px] max-h-full rounded-2xl border-4 border-muted-foreground/20 bg-background shadow-xl overflow-hidden'
                : 'h-[740px] max-h-full rounded-3xl border-8 border-muted-foreground/30 bg-background shadow-2xl overflow-hidden'
          }`}
          style={{ width: deviceWidths[device] }}
        >
          <iframe
            ref={iframeRef}
            title="Storefront preview"
            src={previewUrl}
            className="size-full border-0 bg-background"
            onLoad={() => {
              setReady(false)
              setTimedOut(false)
            }}
          />

          {!ready && !timedOut && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 backdrop-blur-xs">
              <LoaderCircle className="size-6 animate-spin text-primary" aria-label="Loading preview" />
              <p className="text-xs text-muted-foreground">{t('saving')}</p>
            </div>
          )}

          {timedOut && !ready && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/95 p-6 text-center">
              <p className="text-sm text-muted-foreground">Preview took longer than expected to load.</p>
              <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
                <RefreshCw className="size-4" />
                {t('refreshPreview')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
