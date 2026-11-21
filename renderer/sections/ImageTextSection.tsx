import type { Locale, SectionInstance } from '@/shared/types/builder'
import { resolveMediaUrl } from '@/shared/lib/media-url'
import { editKey, settingText, settingString } from '../section-utils'

export function ImageTextSection({ section, locale }: { section: SectionInstance; locale: Locale }) {
  const title = settingText(section.settings, 'title', locale, locale === 'ar' ? 'صورة ونص' : 'Image and text')
  const body = settingText(section.settings, 'body', locale)
  // `image_url` is the live schema key; `image` is used by older manifests.
  const imageKey = 'image_url' in section.settings ? 'image_url' : 'image'
  const image = resolveMediaUrl(settingString(section.settings, imageKey))
  return (
    <section className="grid gap-8 px-6 py-16 md:grid-cols-2 md:items-center">
      <div
        {...editKey(imageKey)}
        className="aspect-[4/3] overflow-hidden rounded-2xl bg-muted"
        style={image ? { backgroundImage: `url("${image}")`, backgroundPosition: 'center', backgroundSize: 'cover' } : undefined}
      />
      <div>
        <h2 {...editKey('title')} className="text-3xl font-semibold">{title}</h2>
        {body && <p {...editKey('body')} className="mt-4 text-muted-foreground">{body}</p>}
      </div>
    </section>
  )
}
