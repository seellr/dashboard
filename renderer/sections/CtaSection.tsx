import type { Locale, SectionInstance } from '@/shared/types/builder'
import { settingText } from '../section-utils'

export function CtaSection({ section, locale }: { section: SectionInstance; locale: Locale }) {
  return <section className="mx-auto flex max-w-5xl flex-col items-center gap-5 px-6 py-16 text-center"><h2 className="text-3xl font-semibold">{settingText(section.settings, 'title', locale, locale === 'ar' ? 'ابدأ الآن' : 'Get started today')}</h2><p className="max-w-xl text-muted-foreground">{settingText(section.settings, 'body', locale)}</p><span className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">{settingText(section.settings, 'button_label', locale, locale === 'ar' ? 'تسوق الآن' : 'Shop now')}</span></section>
}
