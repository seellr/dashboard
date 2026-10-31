'use client'

import { useEffect, useRef, useState } from 'react'
import { PageRenderer } from '@/renderer/PageRenderer'
import { getAllowedOrigins, isAllowedOrigin, isPreviewMessage, PREVIEW_SOURCE, type EditorToPreviewMessage } from '@/shared/types/preview-protocol'
import type { BuilderPage, Locale, ThemeSchema } from '@/shared/types/builder'

export function PreviewPageClient({ initialLocale }: { initialLocale: Locale }) {
  const [page, setPage] = useState<BuilderPage | null>(null)
  const [schema, setSchema] = useState<ThemeSchema | null>(null)
  const [locale, setLocale] = useState<Locale>(initialLocale)
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const editorOriginRef = useRef<string | null>(null)

  useEffect(() => {
    const allowedOrigins = getAllowedOrigins()
    const referrerOrigin = document.referrer ? new URL(document.referrer).origin : null
    if (!referrerOrigin || !isAllowedOrigin(referrerOrigin, allowedOrigins)) return
    editorOriginRef.current = referrerOrigin
    window.parent.postMessage({ source: PREVIEW_SOURCE, type: 'READY' }, referrerOrigin)
    const handleMessage = (event: MessageEvent<unknown>) => {
      if (event.source !== window.parent || event.origin !== referrerOrigin || !isPreviewMessage(event.data)) return
      const message = event.data as EditorToPreviewMessage
      if (message.type === 'INIT') { setPage(message.page); setSchema(message.schema); setLocale(message.locale) }
      if (message.type === 'UPDATE_PAGE') setPage(message.page)
      if (message.type === 'SELECT_SECTION') setSelectedSectionId(message.sectionId)
      if (message.type === 'SET_LOCALE') setLocale(message.locale)
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  if (!page || !schema) return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Waiting for preview data...</div>
  return <PageRenderer page={page} locale={locale} selectedSectionId={selectedSectionId} onSectionClick={(sectionId) => { if (editorOriginRef.current) window.parent.postMessage({ source: PREVIEW_SOURCE, type: 'SECTION_CLICKED', sectionId }, editorOriginRef.current) }} />
}
