'use client'

import { useState } from 'react'
import { ImageOff } from 'lucide-react'

/**
 * Media thumbnails are plain `<img>`s against the backend storage host. When a
 * file is missing on the server the browser fires `onError`; replacing the
 * broken icon with a labelled placeholder makes that visible instead of
 * leaving a grey box that looks like a UI bug.
 */
export function MediaThumbnail({
  src,
  alt,
  className = '',
}: {
  src?: string | null
  alt?: string
  className?: string
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const failed = Boolean(src) && failedSrc === src

  if (!src || failed) {
    return (
      <div
        className={`flex aspect-video flex-col items-center justify-center gap-1 bg-muted p-2 text-center ${className}`}
        title={failed ? src ?? undefined : undefined}
      >
        <ImageOff className="size-6 text-muted-foreground" aria-hidden="true" />
        <span className="line-clamp-2 text-[10px] leading-tight text-muted-foreground">
          {failed ? 'Preview unavailable' : 'No image'}
        </span>
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt ?? ''}
      loading="lazy"
      decoding="async"
      className={`aspect-video w-full object-cover ${className}`}
      onError={() => setFailedSrc(src)}
    />
  )
}
