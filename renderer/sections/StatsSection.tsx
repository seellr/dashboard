import type { Locale, SectionInstance } from '@/shared/types/builder'
import { editKey, settingText } from '../section-utils'

const DEFAULT_VALUES = ['10K+', '4.9/5', '24/7']

export function StatsSection({ section, locale }: { section: SectionInstance; locale: Locale }) {
  return (
    <section className="border-y bg-muted/30 px-6 py-12">
      <div className="mx-auto grid max-w-6xl gap-8 text-center sm:grid-cols-3">
        {[1, 2, 3].map((item, index) => (
          <div key={item}>
            <div {...editKey(`value_${item}`)} className="text-4xl font-bold text-primary">
              {settingText(section.settings, `value_${item}`, locale, DEFAULT_VALUES[index])}
            </div>
            <p {...editKey(`label_${item}`)} className="mt-2 text-sm text-muted-foreground">
              {settingText(section.settings, `label_${item}`, locale, locale === 'ar' ? `مؤشر ثقة ${item}` : `Trust metric ${item}`)}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
