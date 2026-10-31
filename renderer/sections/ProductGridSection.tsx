import type { Locale, SectionInstance } from '@/shared/types/builder'
import { settingText } from '../section-utils'

export function ProductGridSection({ section, locale }: { section: SectionInstance; locale: Locale }) {
  const title = settingText(section.settings, 'title', locale, locale === 'ar' ? 'منتجاتنا' : 'Featured products')
  const count = Number(section.settings.count ?? 3)
  return <section className="px-6 py-16"><h2 className="mb-8 text-2xl font-semibold">{title}</h2><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: Math.max(1, Math.min(count, 12)) }, (_, index) => <article key={index} className="overflow-hidden rounded-xl border bg-card"><div className="aspect-[4/3] bg-muted" /><div className="p-4"><div className="h-4 w-2/3 rounded bg-muted" /><div className="mt-3 h-3 w-1/3 rounded bg-muted" /></div></article>)}</div></section>
}
