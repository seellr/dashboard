import type { Locale, SectionInstance, SettingValue } from '@/shared/types/builder'
import { resolveMediaUrl } from '@/shared/lib/media-url'
import { settingString, settingText } from '../section-utils'

/**
 * The live theme schema exposes the hero image under different keys depending
 * on the theme manifest (`image`, `image_url`, `background_image`, …). Accept
 * all of them, plus media reference objects, so an uploaded image shows up
 * regardless of the theme's naming.
 */
const HERO_IMAGE_KEYS = ['image', 'image_url', 'background_image', 'background_image_url', 'hero_image', 'banner_image', 'media']

const IMAGE_URL_PATTERN = /\.(png|jpe?g|webp|gif|avif|svg)(\?|#|$)/i

function isImageLikeUrl(value: string): boolean {
  return IMAGE_URL_PATTERN.test(value) || value.includes('/storage/')
}

function readImageUrl(settings: SectionInstance['settings']): string {
  for (const key of HERO_IMAGE_KEYS) {
    const value: SettingValue | undefined = settings[key]
    if (typeof value === 'string' && value) return value
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const reference = value as { url?: unknown; thumb_url?: unknown }
      if (typeof reference.url === 'string' && reference.url) return reference.url
      if (typeof reference.thumb_url === 'string' && reference.thumb_url) return reference.thumb_url
    }
  }
  // Fallback for themes that name the image setting differently.
  for (const value of Object.values(settings)) {
    if (typeof value === 'string' && isImageLikeUrl(value)) return value
  }
  return ''
}

/** Padding presets for the schema's `height` select (sm | md | lg). */
function heroPadding(height: string): string {
  if (height === 'sm') return 'py-16 md:py-20'
  if (height === 'lg') return 'py-32 md:py-44'
  return 'py-24 md:py-32'
}

export function HeroSection({ section, locale }: { section: SectionInstance; locale: Locale }) {
  // The live schema uses `heading` / `subheading`; older themes used
  // `title` / `subtitle`. Read the schema keys first.
  const title =
    settingText(section.settings, 'heading', locale)
    || settingText(section.settings, 'title', locale, locale === 'ar' ? 'مرحبًا بك' : 'Welcome')
  const subtitle =
    settingText(section.settings, 'subheading', locale)
    || settingText(section.settings, 'subtitle', locale)
  const background = settingString(section.settings, 'background_color', 'var(--theme-primary)')
  const image = resolveMediaUrl(readImageUrl(section.settings))
  const padded = heroPadding(settingString(section.settings, 'height', 'md'))
  const buttons = (section.blocks ?? []).filter((block) => (block.type ?? 'button') === 'button')

  return (
    <section
      className={`relative isolate overflow-hidden bg-slate-950 px-6 text-center text-white ${padded}`}
      style={image ? undefined : { background }}
    >
      {image ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" className="absolute inset-0 -z-20 size-full object-cover" />
          <div className="absolute inset-0 -z-10 bg-black/50" aria-hidden="true" />
        </>
      ) : (
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,var(--theme-primary),transparent_58%)] opacity-80" aria-hidden="true" />
      )}
      <div className="mx-auto max-w-4xl">
        <span className="mb-6 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-medium text-white/80">
          {locale === 'ar' ? 'اختيارات مصممة لك' : 'Curated for you'}
        </span>
        <h1 className="text-4xl font-bold leading-[1.1] tracking-tight md:text-7xl">{title}</h1>
        {subtitle && <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/65">{subtitle}</p>}
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          {buttons.length > 0 ? (
            buttons.map((button) => {
              const url = settingString(button.settings, 'url', '#')
              return (
                <a
                  key={button.id}
                  href={url}
                  className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white/90"
                >
                  {settingText(button.settings, 'label', locale, locale === 'ar' ? 'تسوق الآن' : 'Shop now')}
                </a>
              )
            })
          ) : (
            <span className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950">
              {locale === 'ar' ? 'استكشف المنتجات' : 'Explore products'}
            </span>
          )}
        </div>
      </div>
    </section>
  )
}
