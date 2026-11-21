import type { Locale, SectionInstance } from '@/shared/types/builder'
import { editKey, settingText } from '../section-utils'

const DEFAULT_NAMES = ['NOVA', 'MOTION', 'PULSE', 'ORBIT', 'LUMA']

export function LogoCloudSection({ section, locale }: { section: SectionInstance; locale: Locale }) {
  const heading = settingText(section.settings, 'heading', locale, locale === 'ar' ? 'يثق بنا عملاؤنا' : 'Trusted by teams at')
  return (
    <section className="px-6 py-12 text-center">
      <p {...editKey('heading')} className="mb-7 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">{heading}</p>
      <div className="flex flex-wrap justify-center gap-3">
        {DEFAULT_NAMES.map((fallback, index) => (
          <span
            key={fallback}
            {...editKey(`name_${index + 1}`)}
            className="rounded-xl border bg-card px-5 py-3 text-sm font-bold tracking-widest text-muted-foreground"
          >
            {settingText(section.settings, `name_${index + 1}`, locale, fallback)}
          </span>
        ))}
      </div>
    </section>
  )
}
