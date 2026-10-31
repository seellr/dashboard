'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { BuilderPage } from '@/shared/types/builder'

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'failed'

interface UseAutoSaveDraftOptions {
  page: BuilderPage
  dirty: boolean
  save: (page: BuilderPage) => Promise<unknown>
  delayMs?: number
}

export function useAutoSaveDraft({ page, dirty, save, delayMs = 1000 }: UseAutoSaveDraftOptions) {
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
    if (!dirty) return
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => void runRef.current(), delayMs)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [dirty, page, delayMs])

  const retry = useCallback(() => { if (dirty) void runRef.current() }, [dirty])
  const flush = useCallback(async () => { if (timer.current) clearTimeout(timer.current); await runRef.current() }, [])
  return { status, error, retry, flush }
}
