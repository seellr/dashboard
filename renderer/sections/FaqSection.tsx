import type { Locale, SectionInstance } from '@/shared/types/builder'
import { settingText } from '../section-utils'

export function FaqSection({ section, locale }: { section: SectionInstance; locale: Locale }) {
  const title = settingText(section.settings, 'title', locale, locale === 'ar' ? 'الأسئلة الشائعة' : 'Frequently asked questions')
  const items = section.blocks ?? []
  return <section className="mx-auto max-w-3xl px-6 py-16"><h2 className="mb-6 text-2xl font-semibold">{title}</h2><div className="divide-y rounded-xl border">{(items.length ? items : [{ id: 'faq-placeholder', type: 'faq', settings: { question: { ar: 'سؤال', en: 'Question' }, answer: { ar: 'الإجابة', en: 'Answer' } } }]).map((item) => <details key={item.id} className="group p-5"><summary className="cursor-pointer font-medium">{settingText(item.settings, 'question', locale, locale === 'ar' ? 'السؤال' : 'Question')}</summary><p className="mt-3 text-sm text-muted-foreground">{settingText(item.settings, 'answer', locale, locale === 'ar' ? 'الإجابة' : 'Answer')}</p></details>)}</div></section>
}
