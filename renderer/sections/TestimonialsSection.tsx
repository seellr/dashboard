import type { Locale, SectionInstance } from '@/shared/types/builder'
import { settingText } from '../section-utils'

export function TestimonialsSection({ section, locale }: { section: SectionInstance; locale: Locale }) {
  const items = section.blocks?.length ? section.blocks : [{ id: 'testimonial-placeholder', type: 'testimonial', settings: { quote: { ar: 'تجربة رائعة.', en: 'A wonderful experience.' }, author: { ar: 'عميل', en: 'Customer' } } }]
  return <section className="mx-auto max-w-6xl px-6 py-16"><h2 className="mb-8 text-center text-2xl font-semibold">{settingText(section.settings, 'heading', locale) || settingText(section.settings, 'title', locale, locale === 'ar' ? 'ماذا يقول عملاؤنا' : 'What our customers say')}</h2><div className="grid gap-5 md:grid-cols-3">{items.map((item) => <blockquote key={item.id} className="rounded-xl border bg-card p-6"><p className="text-muted-foreground">“{settingText(item.settings, 'quote', locale)}”</p><footer className="mt-4 text-sm font-medium">{settingText(item.settings, 'author', locale)}</footer></blockquote>)}</div></section>
}
