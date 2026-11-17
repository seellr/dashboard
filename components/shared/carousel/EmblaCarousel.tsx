'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const SLIDE_WIDTH: Record<number, string> = {
  1: 'flex-[0_0_100%]',
  2: 'flex-[0_0_88%] sm:flex-[0_0_50%]',
  3: 'flex-[0_0_88%] sm:flex-[0_0_50%] lg:flex-[0_0_33.3333%]',
  4: 'flex-[0_0_88%] sm:flex-[0_0_50%] lg:flex-[0_0_25%]',
}

export interface EmblaCarouselProps {
  children: ReactNode
  /** Accessible name for the carousel region. */
  label?: string
  /** Number of slides visible on large screens (1–4). */
  slidesPerView?: number
  loop?: boolean
  autoplay?: boolean
  autoplayDelay?: number
  showArrows?: boolean
  showDots?: boolean
  /** Right-to-left stores (Arabic) need Embla's RTL direction. */
  rtl?: boolean
  className?: string
  slideClassName?: string
  previousLabel?: string
  nextLabel?: string
  goToSlideLabel?: (index: number) => string
}

/**
 * Thin Embla wrapper shared by the storefront renderer and the seller
 * dashboard. Slides are sized with static width classes so Tailwind can
 * generate them, and spacing is applied with logical padding to keep RTL
 * layouts correct.
 */
export function EmblaCarousel({
  children,
  label,
  slidesPerView = 4,
  loop = true,
  autoplay = false,
  autoplayDelay = 4500,
  showArrows = true,
  showDots = false,
  rtl = false,
  className,
  slideClassName,
  previousLabel = 'Previous slide',
  nextLabel = 'Next slide',
  goToSlideLabel = (index) => `Go to slide ${index + 1}`,
}: EmblaCarouselProps) {
  const perView = Math.min(4, Math.max(1, Math.round(slidesPerView)))
  const plugins = useMemo(
    () =>
      autoplay
        ? [
            Autoplay({
              delay: autoplayDelay,
              playOnInit: true,
              stopOnInteraction: false,
              stopOnMouseEnter: true,
            }),
          ]
        : [],
    [autoplay, autoplayDelay],
  )

  const [viewportRef, emblaApi] = useEmblaCarousel(
    {
      align: 'start',
      containScroll: 'trimSnaps',
      direction: rtl ? 'rtl' : 'ltr',
      loop,
    },
    plugins,
  )

  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [snaps, setSnaps] = useState<number[]>([])

  useEffect(() => {
    if (!emblaApi) return

    const sync = () => {
      setCanScrollPrev(emblaApi.canScrollPrev())
      setCanScrollNext(emblaApi.canScrollNext())
      setSelectedIndex(emblaApi.selectedScrollSnap())
      setSnaps(emblaApi.scrollSnapList())
    }

    sync()
    emblaApi.on('select', sync)
    emblaApi.on('reInit', sync)
    return () => {
      emblaApi.off('select', sync)
      emblaApi.off('reInit', sync)
    }
  }, [emblaApi])

  return (
    <div
      className={cn('relative', className)}
      dir={rtl ? 'rtl' : 'ltr'}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
    >
      <div ref={viewportRef} className="overflow-hidden">
        <div className="-ms-4 flex touch-pan-y">
          {Array.isArray(children) ? (
            children.map((child, index) => (
              <div
                key={index}
                className={cn('min-w-0 shrink-0 ps-4', SLIDE_WIDTH[perView], slideClassName)}
              >
                {child}
              </div>
            ))
          ) : (
            <div className={cn('min-w-0 shrink-0 ps-4', SLIDE_WIDTH[perView], slideClassName)}>
              {children}
            </div>
          )}
        </div>
      </div>

      {showArrows && (
        <>
          <button
            type="button"
            onClick={() => emblaApi?.scrollPrev()}
            disabled={!canScrollPrev}
            aria-label={previousLabel}
            className="absolute start-1 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-border/70 bg-background/90 text-foreground shadow-sm backdrop-blur transition-colors hover:bg-background disabled:pointer-events-none disabled:opacity-0"
          >
            <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => emblaApi?.scrollNext()}
            disabled={!canScrollNext}
            aria-label={nextLabel}
            className="absolute end-1 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-border/70 bg-background/90 text-foreground shadow-sm backdrop-blur transition-colors hover:bg-background disabled:pointer-events-none disabled:opacity-0"
          >
            <ChevronRight className="size-4 rtl:rotate-180" aria-hidden="true" />
          </button>
        </>
      )}

      {showDots && snaps.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-1.5">
          {snaps.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => emblaApi?.scrollTo(index)}
              aria-label={goToSlideLabel(index)}
              aria-current={selectedIndex === index}
              className={cn(
                'h-1.5 rounded-full transition-all',
                selectedIndex === index
                  ? 'w-6 bg-primary'
                  : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60',
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}
