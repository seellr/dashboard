import type { Locale, SectionInstance } from '@/shared/types/builder'
import { editKey, settingText } from '../section-utils'

export function CtaSection({ section, locale }: { section: SectionInstance; locale: Locale }) {
  const title = settingText(section.settings, 'title', locale, locale === 'ar' ? 'ابدأ الآن' : 'Get started today')
  const body = settingText(section.settings, 'body', locale)
  const buttonLabel = settingText(section.settings, 'button_label', locale, locale === 'ar' ? 'تسوق الآن' : 'Shop now')
  return (
    <section className="mx-auto flex max-w-5xl flex-col items-center gap-5 px-6 py-16 text-center">
      <h2 {...editKey('title')} className="text-3xl font-semibold">{title}</h2>
      {body && <p {...editKey('body')} className="max-w-xl text-muted-foreground">{body}</p>}
      <span {...editKey('button_label')} className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">{buttonLabel}</span>
    </section>
  )
}
