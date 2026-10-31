import type { Locale, SectionInstance } from '@/shared/types/builder'
import { settingText, settingString } from '../section-utils'

export function ImageTextSection({ section, locale }: { section: SectionInstance; locale: Locale }) {
  const title = settingText(section.settings, 'title', locale, locale === 'ar' ? 'صورة ونص' : 'Image and text')
  const body = settingText(section.settings, 'body', locale)
  const image = settingString(section.settings, 'image_url')
  return <section className="grid gap-8 px-6 py-16 md:grid-cols-2 md:items-center"><div className="aspect-[4/3] overflow-hidden rounded-2xl bg-muted" style={image ? { backgroundImage: `url(${image})`, backgroundPosition: 'center', backgroundSize: 'cover' } : undefined} /><div><h2 className="text-3xl font-semibold">{title}</h2>{body && <p className="mt-4 text-muted-foreground">{body}</p>}</div></section>
}
