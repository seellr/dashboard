'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { BuilderPage } from '@/shared/types/builder'

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'failed'

interface UseAutoSaveDraftOptions {
  page: BuilderPage
  dirty: boolean
  save: (page: BuilderPage) => Promise<unknown>
  delayMs?: number
  /** Disable saves while the editor has no server-backed page. */
  enabled?: boolean
}

export function useAutoSaveDraft({ page, dirty, save, delayMs = 1000, enabled = true }: UseAutoSaveDraftOptions) {
  const [status, setStatus] = useState<AutoSaveStatus>('idle')
  const [error, setError] = useState<unknown>(null)
  const latestPage = useRef(page)
  const inFlight = useRef(false)
  const queued = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const runRef = useRef<() => Promise<void>>(async () => undefined)
  const inFlightPromise = useRef<Promise<void> | null>(null)
  useEffect(() => { latestPage.current = page }, [page])

  const run = useCallback(async () => {
    if (inFlight.current) { queued.current = true; await inFlightPromise.current; return }
    inFlight.current = true
    queued.current = false
    setStatus('saving')
    setError(null)
    const request = (async () => {
      try { await save(latestPage.current); setStatus('saved') } catch (caught) { setError(caught); setStatus('failed') }
      finally { inFlight.current = false; inFlightPromise.current = null }
    })()
    inFlightPromise.current = request
    await request
    if (queued.current) { queued.current = false; await runRef.current() }
  }, [save])
  useEffect(() => { runRef.current = run }, [run])

  useEffect(() => {
    if (!enabled || !dirty) return
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => void runRef.current(), delayMs)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [dirty, page, delayMs, enabled])

  const retry = useCallback(() => { if (dirty && enabled) void runRef.current() }, [dirty, enabled])
  const flush = useCallback(async () => {
    if (!enabled || !dirty) return
    if (timer.current) clearTimeout(timer.current)
    await runRef.current()
  }, [dirty, enabled])
  return { status, error, retry, flush }
}
