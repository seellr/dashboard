import type { Locale, SectionInstance } from '@/shared/types/builder'
import { settingString, settingText } from '../section-utils'

export function FooterSection({ section, locale }: { section: SectionInstance; locale: Locale }) {
  // Live schema uses `copyright`; older themes used `label`.
  const label =
    settingText(section.settings, 'copyright', locale)
    || settingText(section.settings, 'label', locale, locale === 'ar' ? 'جميع الحقوق محفوظة' : 'All rights reserved')
  const links = (section.blocks ?? []).filter((block) => (block.type ?? 'link') === 'link')

  return (
    <footer className="border-t border-border/70 bg-muted/30 px-6 py-10">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{label}</span>
        <div className="flex gap-5">
          {links.length > 0 ? (
            links.map((link) => (
              <a key={link.id} href={settingString(link.settings, 'url', '/')} className="hover:text-foreground">
                {settingText(link.settings, 'label', locale, locale === 'ar' ? 'رابط' : 'Link')}
              </a>
            ))
          ) : (
            <>
              <span>{locale === 'ar' ? 'الخصوصية' : 'Privacy'}</span>
              <span>{locale === 'ar' ? 'الشروط' : 'Terms'}</span>
            </>
          )}
        </div>
      </div>
    </footer>
  )
}
