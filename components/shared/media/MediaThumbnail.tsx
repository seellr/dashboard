'use client'

import { useState } from 'react'
import { ImageOff } from 'lucide-react'

/**
 * Media thumbnails are plain `<img>`s against the backend storage host. When a
 * file is missing on the server the browser fires `onError`; replacing the
 * broken icon with a labelled placeholder makes that visible instead of
 * leaving a grey box that looks like a UI bug.
 *
 * Backends often ship a resized `thumb_url` that was never generated while the
 * full-size `url` still exists (or the other way around), so `fallbackSrc` is
 * tried before giving up.
 */
export function MediaThumbnail({
  src,
  fallbackSrc,
  alt,
  className = '',
  sizeClassName = 'aspect-video w-full',
  fit = 'cover',
  loading = 'lazy',
}: {
  src?: string | null
  fallbackSrc?: string | null
  alt?: string
  className?: string
  /** Replaces the default `aspect-video w-full` box size. */
  sizeClassName?: string
  fit?: 'cover' | 'contain'
  loading?: 'lazy' | 'eager'
}) {
  const [failedSrcs, setFailedSrcs] = useState<string[]>([])

  const candidates: string[] = []
  for (const candidate of [src, fallbackSrc]) {
    if (!candidate) continue
    if (candidates.includes(candidate) || failedSrcs.includes(candidate)) continue
    candidates.push(candidate)
  }
  const current = candidates[0]

  if (!current) {
    const attempted = [src, fallbackSrc].filter((value): value is string => Boolean(value))
    const lastAttempt = attempted.length > 0 ? attempted[attempted.length - 1] : undefined
    return (
      <div
        className={`${sizeClassName} flex flex-col items-center justify-center gap-1 bg-muted p-2 text-center ${className}`}
        title={lastAttempt}
      >
        <ImageOff className="size-6 text-muted-foreground" aria-hidden="true" />
        <span className="line-clamp-2 text-[10px] leading-tight text-muted-foreground">
          {lastAttempt ? 'Preview unavailable' : 'No image'}
        </span>
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={current}
      alt={alt ?? ''}
      loading={loading}
      decoding="async"
      className={`${sizeClassName} ${fit === 'contain' ? 'object-contain' : 'object-cover'} ${className}`}
      onError={() =>
        setFailedSrcs((previous) =>
          previous.includes(current) ? previous : [...previous, current],
        )
      }
    />
  )
}
