import { ArrowUpRight, Megaphone } from 'lucide-react'
import type { Locale, SectionInstance } from '@/shared/types/builder'
import { settingString, settingText } from '../section-utils'

export function AnnouncementSection({ section, locale }: { section: SectionInstance; locale: Locale }) {
  const ar = locale === 'ar'
  const href = settingString(section.settings, 'link_href', '#products')
  const linkLabel = settingText(section.settings, 'link_label', locale, ar ? 'تسوق الآن' : 'Shop now')
  return <div className="relative isolate overflow-hidden border-b border-primary/15 bg-primary px-6 py-3 text-primary-foreground shadow-sm"><div className="absolute inset-y-0 start-0 w-1/3 bg-white/10 blur-2xl" /><div className="relative mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center text-xs font-semibold leading-5 sm:text-sm"><span className="inline-flex shrink-0 items-center gap-2"><span className="grid size-6 place-items-center rounded-full bg-white/15"><Megaphone className="size-3.5" /></span><span className="text-balance">{settingText(section.settings, 'message', locale, ar ? 'شحن مجاني لفترة محدودة' : 'Free shipping for a limited time')}</span></span><a href={href} className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-bold transition-colors hover:bg-white/20">{linkLabel}<ArrowUpRight className="size-3 rtl:-scale-x-100" /></a></div></div>
}
