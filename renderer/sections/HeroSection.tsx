import type { Locale, SectionInstance } from '@/shared/types/builder'
import { settingString, settingText } from '../section-utils'

export function HeroSection({ section, locale }: { section: SectionInstance; locale: Locale }) {
  const title = settingText(section.settings, 'title', locale, locale === 'ar' ? 'مرحبًا بك' : 'Welcome')
  const subtitle = settingText(section.settings, 'subtitle', locale)
  const background = settingString(section.settings, 'background_color', 'var(--theme-primary)')
  return <section className="relative isolate overflow-hidden bg-slate-950 px-6 py-24 text-center text-white md:py-32" style={{ background }}><div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,var(--theme-primary),transparent_58%)] opacity-80" /><div className="mx-auto max-w-4xl"><span className="mb-6 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-medium text-white/80">{locale === 'ar' ? 'اختيارات مصممة لك' : 'Curated for you'}</span><h1 className="text-4xl font-bold leading-[1.1] tracking-tight md:text-7xl">{title}</h1>{subtitle && <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/65">{subtitle}</p>}<span className="mt-9 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950">{locale === 'ar' ? 'استكشف المنتجات' : 'Explore products'}</span></div></section>
}
