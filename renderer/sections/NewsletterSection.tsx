import type { Locale, SectionInstance } from '@/shared/types/builder'
import { editKey, settingText } from '../section-utils'

export function NewsletterSection({ section, locale }: { section: SectionInstance; locale: Locale }) {
  const title = settingText(section.settings, 'title', locale, locale === 'ar' ? 'اشترك في النشرة' : 'Join our newsletter')
  const body = settingText(section.settings, 'body', locale, locale === 'ar' ? 'احصل على آخر الأخبار والعروض.' : 'Get the latest news and offers.')
  const placeholder = settingText(section.settings, 'placeholder', locale, locale === 'ar' ? 'بريدك الإلكتروني' : 'Your email address')
  const buttonLabel = settingText(section.settings, 'button_label', locale, locale === 'ar' ? 'اشترك' : 'Subscribe')
  return (
    <section className="mx-auto max-w-3xl px-6 py-16 text-center">
      <h2 {...editKey('title')} className="text-2xl font-bold">{title}</h2>
      <p {...editKey('body')} className="mt-3 text-sm text-muted-foreground">{body}</p>
      <div className="mx-auto mt-6 flex max-w-md gap-2">
        <div {...editKey('placeholder')} className="flex h-11 flex-1 items-center rounded-xl border bg-background px-3 text-sm text-muted-foreground">
          {placeholder}
        </div>
        <div {...editKey('button_label')} className="grid h-11 w-24 place-items-center rounded-xl bg-primary text-sm font-medium text-primary-foreground">
          {buttonLabel}
        </div>
      </div>
    </section>
  )
}
