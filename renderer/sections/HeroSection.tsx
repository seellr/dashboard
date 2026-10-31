import type { Locale, SectionInstance } from '@/shared/types/builder'
import { settingString, settingText } from '../section-utils'

export function HeroSection({ section, locale }: { section: SectionInstance; locale: Locale }) {
  const title = settingText(section.settings, 'title', locale, locale === 'ar' ? 'مرحبًا بك' : 'Welcome')
  const subtitle = settingText(section.settings, 'subtitle', locale)
  const background = settingString(section.settings, 'background_color', 'var(--theme-primary)')
  return <section className="theme-hero px-6 py-24 text-center text-white" style={{ background }}><h1 className="text-4xl font-bold tracking-tight md:text-6xl">{title}</h1>{subtitle && <p className="mx-auto mt-5 max-w-2xl text-lg text-white/80">{subtitle}</p>}</section>
}
