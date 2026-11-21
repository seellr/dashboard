import type { Locale, SectionInstance } from '@/shared/types/builder'
import { resolveMediaUrl } from '@/shared/lib/media-url'
import { editKey, settingText, settingString } from '../section-utils'

export function VideoSection({ section, locale }: { section: SectionInstance; locale: Locale }) {
  const url = resolveMediaUrl(settingString(section.settings, 'video_url'))
  const title = settingText(section.settings, 'title', locale, locale === 'ar' ? 'شاهد قصتنا' : 'Watch our story')
  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <div
        {...editKey('video_url')}
        className="relative aspect-video overflow-hidden rounded-3xl bg-slate-950"
        style={url ? { backgroundImage: `url("${url}")`, backgroundPosition: 'center', backgroundSize: 'cover' } : undefined}
      >
        <div className="absolute inset-0 grid place-items-center bg-black/30">
          <div className="grid size-16 place-items-center rounded-full bg-white text-xl text-slate-950">▶</div>
        </div>
      </div>
      <h2 {...editKey('title')} className="mt-5 text-center text-2xl font-bold">{title}</h2>
    </section>
  )
}
