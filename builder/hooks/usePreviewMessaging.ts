'use client'

import { useCallback, useEffect, useRef } from 'react'
import type { BuilderPage, Locale, ThemeRuntimeSettings, ThemeSchema } from '@/shared/types/builder'
import { getAllowedOrigins, isAllowedOrigin, isPreviewMessage, PREVIEW_PROTOCOL_VERSION, PREVIEW_SOURCE, type PreviewToEditorMessage, type EditorToPreviewMessage } from '@/shared/types/preview-protocol'

interface UsePreviewMessagingOptions {
  iframeRef: React.RefObject<HTMLIFrameElement | null>
  page: BuilderPage
  schema: ThemeSchema
  locale: Locale
  themeSettings?: ThemeRuntimeSettings
  selectedSectionId?: string | null
  focusedField?: { sectionId: string; blockId?: string | null; key: string; token: number } | null
  onMessage?: (message: PreviewToEditorMessage) => void
  onReadyChange?: (ready: boolean) => void
}

export function usePreviewMessaging({ iframeRef, page, schema, locale, themeSettings = {}, selectedSectionId, focusedField, onMessage, onReadyChange }: UsePreviewMessagingOptions) {
  const targetOriginRef = useRef<string | null>(null)
  const pageRef = useRef(page)
  const schemaRef = useRef(schema)
  const localeRef = useRef(locale)
  const themeSettingsRef = useRef(themeSettings)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => { pageRef.current = page; schemaRef.current = schema; localeRef.current = locale; themeSettingsRef.current = themeSettings }, [page, schema, locale, themeSettings])

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
        send({ source: PREVIEW_SOURCE, v: PREVIEW_PROTOCOL_VERSION, type: 'INIT', page: pageRef.current, schema: schemaRef.current, themeSettings: themeSettingsRef.current, locale: localeRef.current })
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [iframeRef, onMessage, onReadyChange, send])

  useEffect(() => {
    if (!targetOriginRef.current) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => send({ source: PREVIEW_SOURCE, v: PREVIEW_PROTOCOL_VERSION, type: 'UPDATE_PAGE', page }), 120)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [page, send])

  useEffect(() => {
    if (selectedSectionId !== undefined) send({ source: PREVIEW_SOURCE, v: PREVIEW_PROTOCOL_VERSION, type: 'SELECT_SECTION', sectionId: selectedSectionId ?? null })
  }, [selectedSectionId, send])

  useEffect(() => {
    send({
      source: PREVIEW_SOURCE,
      v: PREVIEW_PROTOCOL_VERSION,
      type: 'SET_EDITING',
      sectionId: focusedField?.sectionId ?? null,
      blockId: focusedField?.blockId ?? null,
      key: focusedField?.key ?? null,
    })
  }, [focusedField, send])

  useEffect(() => { send({ source: PREVIEW_SOURCE, v: PREVIEW_PROTOCOL_VERSION, type: 'SET_LOCALE', locale }) }, [locale, send])

  useEffect(() => {
    // Only broadcast once the preview has announced itself; `send` is a no-op
    // before that, and INIT already carries the latest settings.
    if (!targetOriginRef.current) return
    send({ source: PREVIEW_SOURCE, v: PREVIEW_PROTOCOL_VERSION, type: 'UPDATE_SETTINGS', themeSettings })
  }, [themeSettings, send])

  const retry = useCallback(() => {
    onReadyChange?.(false)
    targetOriginRef.current = null
    iframeRef.current?.contentWindow?.location.reload()
  }, [iframeRef, onReadyChange])

  return { send, retry }
}
