'use client'

import { useEffect, useState } from 'react'
import DOMPurify from 'dompurify'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Rich text values are stored as HTML. They are rendered only after mount so
 * the server never emits unsanitized markup (and hydration stays consistent).
 */
export function RichTextContent({ html, className }: { html: string; className?: string }) {
  const [sanitized, setSanitized] = useState('')

  useEffect(() => {
    const source = (html ?? '').trim()
    if (!source) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSanitized('')
      return
    }
    const markup = source.includes('<') ? source : `<p>${escapeHtml(source)}</p>`
    setSanitized(
      DOMPurify.sanitize(markup, {
        USE_PROFILES: { html: true },
        ADD_ATTR: ['target'],
        FORBID_TAGS: ['style', 'script', 'iframe', 'form', 'input', 'button'],
      }),
    )
  }, [html])

  if (!sanitized) return null
  return <div className={className} dangerouslySetInnerHTML={{ __html: sanitized }} />
}
