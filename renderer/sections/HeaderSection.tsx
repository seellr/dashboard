import type { Locale, SectionInstance } from '@/shared/types/builder'
import { settingText } from '../section-utils'

export function HeaderSection({ section, locale }: { section: SectionInstance; locale: Locale }) {
  const label = settingText(section.settings, 'label', locale, locale === 'ar' ? 'متجري' : 'My store')
  return <header className="flex items-center justify-between border-b px-6 py-4"><span className="font-semibold">{label}</span><nav className="flex gap-4 text-sm text-muted-foreground"><span>{locale === 'ar' ? 'الرئيسية' : 'Home'}</span><span>{locale === 'ar' ? 'المتجر' : 'Shop'}</span></nav></header>
}
