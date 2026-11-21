'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { PageRenderer } from '@/renderer/PageRenderer'
import { getAllowedOrigins, isAllowedOrigin, isPreviewMessage, PREVIEW_PROTOCOL_VERSION, PREVIEW_SOURCE, type EditorToPreviewMessage, type PreviewToEditorMessage } from '@/shared/types/preview-protocol'
import type { BuilderPage, Locale, ThemeRuntimeSettings, ThemeSchema } from '@/shared/types/builder'

interface EditingField {
  sectionId: string
  blockId?: string | null
  key: string
}

export function PreviewPageClient({ initialLocale }: { initialLocale: Locale }) {
  const [page, setPage] = useState<BuilderPage | null>(null)
  const [schema, setSchema] = useState<ThemeSchema | null>(null)
  const [themeSettings, setThemeSettings] = useState<ThemeRuntimeSettings>({})
  const [locale, setLocale] = useState<Locale>(initialLocale)
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [editing, setEditing] = useState<EditingField | null>(null)
  const editorOriginRef = useRef<string | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  const post = useCallback((message: PreviewToEditorMessage) => {
    if (editorOriginRef.current) window.parent.postMessage(message, editorOriginRef.current)
  }, [])

  useEffect(() => {
    const allowedOrigins = getAllowedOrigins()
    const referrerOrigin = document.referrer ? new URL(document.referrer).origin : null
    if (!referrerOrigin || !isAllowedOrigin(referrerOrigin, allowedOrigins)) return
    editorOriginRef.current = referrerOrigin
    window.parent.postMessage({ source: PREVIEW_SOURCE, v: PREVIEW_PROTOCOL_VERSION, type: 'READY' }, referrerOrigin)
    const handleMessage = (event: MessageEvent<unknown>) => {
      if (event.source !== window.parent || event.origin !== referrerOrigin || !isPreviewMessage(event.data)) return
      const message = event.data as EditorToPreviewMessage
      if (message.type === 'INIT') { setPage(message.page); setSchema(message.schema); setThemeSettings(message.themeSettings ?? {}); setLocale(message.locale) }
      if (message.type === 'UPDATE_PAGE') setPage(message.page)
      if (message.type === 'UPDATE_SETTINGS') setThemeSettings(message.themeSettings ?? {})
      if (message.type === 'SELECT_SECTION') {
        setSelectedSectionId(message.sectionId)
        setEditing(null)
      }
      if (message.type === 'SET_EDITING') {
        setEditing(message.sectionId && message.key ? { sectionId: message.sectionId, blockId: message.blockId, key: message.key } : null)
      }
      if (message.type === 'SET_LOCALE') setLocale(message.locale)
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  /**
   * Every editable text in the storefront carries `data-setting="<key>"` (and
   * `data-block-id` when it belongs to a repeating block). A click is resolved
   * here so the editor can select the section *and* focus the matching input —
   * previously a preview click only selected the section.
   */
  const handleCanvasClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null
    if (!target) return
    const sectionEl = target.closest<HTMLElement>('[data-section-id]')
    const sectionId = sectionEl?.dataset.sectionId
    if (!sectionId) return

    // Links inside the preview would navigate the iframe away from the page
    // being edited (and lose the message channel).
    const anchor = target.closest('a')
    if (anchor) event.preventDefault()

    const fieldEl = target.closest<HTMLElement>('[data-setting]')
    const key = fieldEl?.dataset.setting
    if (fieldEl && key) {
      const blockEl = fieldEl.closest<HTMLElement>('[data-block-id]')
      const blockId = blockEl?.dataset.blockId ?? null
      setSelectedSectionId(sectionId)
      setEditing({ sectionId, blockId, key })
      post({ source: PREVIEW_SOURCE, v: PREVIEW_PROTOCOL_VERSION, type: 'FIELD_CLICKED', sectionId, blockId, key })
      return
    }

    setSelectedSectionId(sectionId)
    setEditing(null)
    post({ source: PREVIEW_SOURCE, v: PREVIEW_PROTOCOL_VERSION, type: 'SECTION_CLICKED', sectionId })
  }

  // Keep the visual highlight in sync when the settings panel changes focus
  // (or when typing re-renders the section).
  useEffect(() => {
    const root = canvasRef.current
    if (!root) return
    root.querySelectorAll('[data-editing]').forEach((element) => element.removeAttribute('data-editing'))
    if (!editing) return
    // `editKey(key, blockId)` puts both attributes on the same element, so the
    // block-scoped selector must also match the element itself.
    const selector = editing.blockId
      ? `[data-block-id="${editing.blockId}"][data-setting="${editing.key}"], [data-block-id="${editing.blockId}"] [data-setting="${editing.key}"]`
      : `[data-section-id="${editing.sectionId}"] [data-setting="${editing.key}"]`
    const target = root.querySelector<HTMLElement>(selector)
    target?.setAttribute('data-editing', '')
  }, [editing, page])

  if (!page || !schema) return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Waiting for preview data...</div>

  return (
    <div ref={canvasRef} data-builder-preview className="min-h-full" onClick={handleCanvasClick}>
      <PageRenderer page={page} locale={locale} themeSettings={themeSettings} selectedSectionId={selectedSectionId} />
    </div>
  )
}
