'use client'

import { useEffect, useRef, useState } from 'react'
import { LoaderCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePreviewMessaging } from '@/builder/hooks/usePreviewMessaging'
import type { BuilderPage, Locale, ThemeSchema } from '@/shared/types/builder'
import type { PreviewToEditorMessage } from '@/shared/types/preview-protocol'

type Device = 'mobile' | 'tablet' | 'desktop'
const deviceWidths: Record<Device, string> = { mobile: '390px', tablet: '768px', desktop: '100%' }

interface PreviewFrameProps {
  page: BuilderPage
  schema: ThemeSchema
  locale: Locale
  selectedSectionId?: string | null
  onMessage?: (message: PreviewToEditorMessage) => void
  previewToken?: string | null
}

export function PreviewFrame({ page, schema, locale, selectedSectionId, onMessage, previewToken }: PreviewFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [device, setDevice] = useState<Device>('desktop')
  const [ready, setReady] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const { retry } = usePreviewMessaging({ iframeRef, page, schema, locale, selectedSectionId, onMessage, onReadyChange: setReady })

  useEffect(() => {
    const timeout = setTimeout(() => { if (!ready) setTimedOut(true) }, 8000)
    return () => clearTimeout(timeout)
  }, [ready])

  return <div className="flex min-h-[520px] flex-col gap-3 rounded-xl border bg-muted/30 p-3"><div className="flex flex-wrap items-center justify-center gap-2" role="group" aria-label="Preview device"><Button size="sm" variant={device === 'mobile' ? 'secondary' : 'ghost'} onClick={() => setDevice('mobile')}>390px</Button><Button size="sm" variant={device === 'tablet' ? 'secondary' : 'ghost'} onClick={() => setDevice('tablet')}>768px</Button><Button size="sm" variant={device === 'desktop' ? 'secondary' : 'ghost'} onClick={() => setDevice('desktop')}>100%</Button></div><div className="relative flex flex-1 justify-center overflow-auto rounded-lg bg-background"><div className="relative h-[620px] min-h-[620px] w-full max-w-full transition-[width]" style={{ width: deviceWidths[device] }}><iframe ref={iframeRef} title="Storefront preview" src={`/${locale}/preview${previewToken ? `?token=${encodeURIComponent(previewToken)}` : ''}`} className="size-full border-0 bg-background" onLoad={() => { setReady(false); setTimedOut(false) }} />{!ready && !timedOut && <div className="absolute inset-0 flex items-center justify-center bg-background/80"><LoaderCircle className="size-6 animate-spin text-muted-foreground" aria-label="Loading preview" /></div>}{timedOut && !ready && <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/95 text-center"><p className="text-sm text-muted-foreground">Preview did not respond.</p><Button variant="outline" onClick={() => { setTimedOut(false); retry() }} className="gap-2"><RefreshCw className="size-4" />Retry</Button></div>}</div></div></div>
}
