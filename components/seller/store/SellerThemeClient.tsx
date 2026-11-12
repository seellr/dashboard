'use client'
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Check, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  activateSellerTheme,
  getActiveSellerTheme,
  listSellerThemes,
  type SellerActiveTheme,
  type SellerTheme,
  type SellerThemeDescriptor,
} from '@/lib/seller/resource-client'

function descriptorFromTheme(theme: SellerTheme): SellerThemeDescriptor {
  return {
    ulid: theme.ulid,
    handle: theme.slug ?? '',
    name: theme.name ?? theme.slug ?? theme.ulid,
    version: theme.version ?? null,
  }
}

function activeDescriptor(theme: SellerActiveTheme | null): SellerThemeDescriptor | null {
  if (!theme) return null
  if (theme.theme?.ulid) return theme.theme
  if (theme.theme_ulid) {
    const name =
      typeof theme.theme_name === 'string'
        ? theme.theme_name
        : theme.theme_name?.en ?? theme.theme_name?.ar ?? theme.theme_ulid
    return { ulid: theme.theme_ulid, handle: '', name }
  }
  // Some responses return the descriptor directly instead of wrapping it.
  const direct = theme as unknown as Partial<SellerThemeDescriptor> & { slug?: string }
  if (typeof direct.ulid === 'string') {
    return {
      ulid: direct.ulid,
      handle: direct.handle ?? direct.slug ?? '',
      name: direct.name ?? direct.slug ?? direct.ulid,
      version: direct.version ?? null,
    }
  }
  return null
}

/**
 * `POST /subscriber/theme/activate` has been seen returning `{theme}`, the
 * legacy `{theme_ulid, theme_name}` shape, a bare descriptor, or no body.
 * Normalise all of them so the active card can be highlighted immediately.
 */
function normalizeActivation(
  data: SellerActiveTheme | null,
  fallback: SellerTheme,
): SellerActiveTheme {
  const normalized = activeDescriptor(data)
  if (normalized) {
    return { ...(data ?? {}), theme: normalized }
  }
  return { ...(data ?? {}), theme: descriptorFromTheme(fallback) }
}

export function SellerThemeClient({
  onThemeActivated,
}: {
  onThemeActivated?: () => void
} = {}) {
  const t = useTranslations('seller.theme')
  const [items, setItems] = useState<SellerTheme[]>([])
  const [active, setActive] = useState<SellerActiveTheme | null>(null)
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  const load = useCallback(async (append = false, nextCursor?: string | null) => {
    setLoading(true)
    const params = new URLSearchParams({ per_page: '15' })
    if (append && nextCursor) params.set('cursor', nextCursor)
    const result = await listSellerThemes(`?${params.toString()}`)
    setLoading(false)
    if (!result.ok) {
      setMessage(result.message)
      return
    }
    setItems((previous) =>
      append ? [...previous, ...result.data.items] : result.data.items,
    )
    setCursor(result.data.meta?.next_cursor ?? null)
    setHasMore(result.data.meta?.has_more === true)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load()
      void getActiveSellerTheme().then((result) => {
        if (result.ok) setActive(result.data)
      })
    }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  const activate = async (theme: SellerTheme) => {
    if (!window.confirm(t('confirmActivate', { name: theme.name ?? theme.slug ?? theme.ulid })))
      return
    setBusy(theme.ulid)
    setMessage('')
    const result = await activateSellerTheme(theme.ulid)
    setBusy(null)
    if (!result.ok) {
      setMessage(result.message)
      return
    }

    setActive(normalizeActivation(result.data, theme))
    setItems((current) =>
      current.map((item) => ({ ...item, is_active: item.ulid === theme.ulid })),
    )
    setMessage(t('activated'))
    onThemeActivated?.()

    // The activate response may omit `published_at` / unpublished state, and a
    // legacy backend may omit the descriptor entirely. Re-read the canonical
    // active theme without blocking the optimistic UI.
    void getActiveSellerTheme().then((fresh) => {
      if (fresh.ok && fresh.data) setActive(fresh.data)
    })
  }

  const activeUlid =
    activeDescriptor(active)?.ulid ?? items.find((item) => item.is_active)?.ulid

  return (
    <section className="space-y-4">
      {message && (
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
      )}

      {loading && items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('loading')}</p>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center">
          <Palette className="size-8 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((theme) => {
            const isActive = theme.ulid === activeUlid
            return (
              <article key={theme.ulid} className="overflow-hidden rounded-lg border">
                {theme.preview_url ? (
                  <img
                    src={theme.preview_url}
                    alt={theme.name ?? theme.slug ?? theme.ulid}
                    className="aspect-video w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-video items-center justify-center bg-muted">
                    <Palette className="size-8 text-muted-foreground" aria-hidden="true" />
                  </div>
                )}
                <div className="space-y-3 p-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-medium">
                        {theme.name ?? theme.slug ?? theme.ulid}
                      </h2>
                      {theme.has_manifest === false && (
                        <span className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">
                          {t('legacy')}
                        </span>
                      )}
                      {theme.version && (
                        <span className="text-[11px] text-muted-foreground">v{theme.version}</span>
                      )}
                    </div>
                    {theme.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {theme.description}
                      </p>
                    )}
                  </div>
                  {isActive ? (
                    <p className="flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      <Check className="size-4" aria-hidden="true" />
                      {t('active')}
                    </p>
                  ) : (
                    <Button
                      disabled={busy === theme.ulid}
                      onClick={() => void activate(theme)}
                    >
                      {busy === theme.ulid ? t('activating') : t('activate')}
                    </Button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}

      {hasMore && (
        <Button
          variant="outline"
          disabled={loading}
          onClick={() => void load(true, cursor)}
        >
          {t('loadMore')}
        </Button>
      )}
    </section>
  )
}
