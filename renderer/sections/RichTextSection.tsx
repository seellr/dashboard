import type { Locale, SectionInstance } from '@/shared/types/builder'
import { settingText } from '../section-utils'

export function RichTextSection({ section, locale }: { section: SectionInstance; locale: Locale }) {
  const content = settingText(section.settings, 'content', locale, locale === 'ar' ? 'أضف محتوى النص المنسق هنا.' : 'Add rich text content here.')
  return <section className="mx-auto max-w-3xl px-6 py-12"><div className="prose max-w-none dark:prose-invert"><p>{content}</p></div></section>
}
