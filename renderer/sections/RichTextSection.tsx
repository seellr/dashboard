import type { Locale, SectionInstance } from '@/shared/types/builder'
import { editKey, settingText } from '../section-utils'
import { RichTextContent } from '../RichTextContent'

export function RichTextSection({ section, locale }: { section: SectionInstance; locale: Locale }) {
  const heading = settingText(section.settings, 'heading', locale)
  const content = settingText(section.settings, 'content', locale)
  return (
    <section className="mx-auto max-w-3xl px-6 py-12">
      {heading && <h2 {...editKey('heading')} className="mb-6 text-3xl font-bold tracking-tight">{heading}</h2>}
      <div {...editKey('content')}>
        <RichTextContent html={content} className="theme-rich-text" />
      </div>
    </section>
  )
}
