'use client'

import { useCallback, useEffect, useRef } from 'react'
import type { BuilderPage, Locale, ThemeSchema } from '@/shared/types/builder'
import { getAllowedOrigins, isAllowedOrigin, isPreviewMessage, PREVIEW_SOURCE, type PreviewToEditorMessage, type EditorToPreviewMessage } from '@/shared/types/preview-protocol'

interface UsePreviewMessagingOptions {
  iframeRef: React.RefObject<HTMLIFrameElement | null>
  page: BuilderPage
  schema: ThemeSchema
  locale: Locale
  selectedSectionId?: string | null
  onMessage?: (message: PreviewToEditorMessage) => void
  onReadyChange?: (ready: boolean) => void
}

export function usePreviewMessaging({ iframeRef, page, schema, locale, selectedSectionId, onMessage, onReadyChange }: UsePreviewMessagingOptions) {
  const targetOriginRef = useRef<string | null>(null)
  const pageRef = useRef(page)
  const schemaRef = useRef(schema)
  const localeRef = useRef(locale)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => { pageRef.current = page; schemaRef.current = schema; localeRef.current = locale }, [page, schema, locale])

  const send = useCallback((message: EditorToPreviewMessage) => {
    const frame = iframeRef.current
    const targetOrigin = targetOriginRef.current
    if (!frame?.contentWindow || !targetOrigin) return
    frame.contentWindow.postMessage(message, targetOrigin)
  }, [iframeRef])

  useEffect(() => {
    const allowedOrigins = getAllowedOrigins()
    const handleMessage = (event: MessageEvent<unknown>) => {
      if (event.source !== iframeRef.current?.contentWindow || !isAllowedOrigin(event.origin, allowedOrigins) || !isPreviewMessage(event.data)) return
      targetOriginRef.current = event.origin
      const message = event.data as PreviewToEditorMessage
      onMessage?.(message)
      if (message.type === 'READY') {
        onReadyChange?.(true)
        send({ source: PREVIEW_SOURCE, type: 'INIT', page: pageRef.current, schema: schemaRef.current, locale: localeRef.current })
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [iframeRef, onMessage, onReadyChange, send])

  useEffect(() => {
    if (!targetOriginRef.current) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => send({ source: PREVIEW_SOURCE, type: 'UPDATE_PAGE', page }), 120)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [page, send])

  useEffect(() => {
    if (selectedSectionId !== undefined) send({ source: PREVIEW_SOURCE, type: 'SELECT_SECTION', sectionId: selectedSectionId ?? null })
  }, [selectedSectionId, send])

  useEffect(() => { send({ source: PREVIEW_SOURCE, type: 'SET_LOCALE', locale }) }, [locale, send])

  const retry = useCallback(() => {
    onReadyChange?.(false)
    targetOriginRef.current = null
    iframeRef.current?.contentWindow?.location.reload()
  }, [iframeRef, onReadyChange])

  return { send, retry }
}
