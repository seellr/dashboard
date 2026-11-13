import type { Locale, SectionInstance } from '@/shared/types/builder'
import { settingText } from '../section-utils'
import { RichTextContent } from '../RichTextContent'

export function FaqSection({ section, locale }: { section: SectionInstance; locale: Locale }) {
  const title =
    'heading' in section.settings
      ? settingText(section.settings, 'heading', locale)
      : settingText(section.settings, 'title', locale, locale === 'ar' ? 'الأسئلة الشائعة' : 'Frequently asked questions')
  const items = section.blocks ?? []

  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      {title && <h2 className="mb-6 text-2xl font-semibold">{title}</h2>}
      {items.length > 0 && (
        <div className="divide-y rounded-xl border">
          {items.map((item) => (
            <details key={item.id} className="group p-5">
              <summary className="cursor-pointer font-medium">{settingText(item.settings, 'question', locale)}</summary>
              <RichTextContent
                html={settingText(item.settings, 'answer', locale)}
                className="theme-rich-text mt-3 text-sm text-muted-foreground"
              />
            </details>
          ))}
        </div>
      )}
    </section>
  )
}
