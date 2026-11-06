import type { Locale, SectionInstance } from '@/shared/types/builder'
import { settingText } from '../section-utils'

export function FooterSection({ section, locale }: { section: SectionInstance; locale: Locale }) {
  const label = settingText(section.settings, 'label', locale, locale === 'ar' ? 'جميع الحقوق محفوظة' : 'All rights reserved')
  return <footer className="border-t border-border/70 bg-muted/30 px-6 py-10"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 text-sm text-muted-foreground"><span className="font-semibold text-foreground">{label}</span><div className="flex gap-5"><span>{locale === 'ar' ? 'الخصوصية' : 'Privacy'}</span><span>{locale === 'ar' ? 'الشروط' : 'Terms'}</span></div></div></footer>
}
