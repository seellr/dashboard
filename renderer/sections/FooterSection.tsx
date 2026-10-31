import type { Locale, SectionInstance } from '@/shared/types/builder'
import { settingText } from '../section-utils'

export function FooterSection({ section, locale }: { section: SectionInstance; locale: Locale }) {
  const label = settingText(section.settings, 'label', locale, locale === 'ar' ? 'جميع الحقوق محفوظة' : 'All rights reserved')
  return <footer className="border-t px-6 py-8 text-center text-sm text-muted-foreground">{label}</footer>
}
