import type { Locale, SectionInstance } from '@/shared/types/builder'
import { settingText } from '../section-utils'
import { RichTextContent } from '../RichTextContent'

export function RichTextSection({ section, locale }: { section: SectionInstance; locale: Locale }) {
  const heading = settingText(section.settings, 'heading', locale)
  const content = settingText(section.settings, 'content', locale, locale === 'ar' ? 'أضف محتوى النص المنسق هنا.' : 'Add rich text content here.')
  return (
    <section className="mx-auto max-w-3xl px-6 py-12">
      {heading && <h2 className="mb-6 text-3xl font-bold tracking-tight">{heading}</h2>}
      <RichTextContent html={content} className="theme-rich-text" />
    </section>
  )
}
