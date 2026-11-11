import type { Locale, SectionInstance } from '@/shared/types/builder'
import { settingText } from '../section-utils'

const GRID_BY_COLUMNS: Record<string, string> = {
  '2': 'sm:grid-cols-2',
  '3': 'sm:grid-cols-2 lg:grid-cols-3',
  '4': 'sm:grid-cols-2 lg:grid-cols-4',
}

export function ProductGridSection({ section, locale }: { section: SectionInstance; locale: Locale }) {
  // Live schema: `heading`, `products` (ULID list), `columns` (2–4).
  const title =
    settingText(section.settings, 'heading', locale)
    || settingText(section.settings, 'title', locale, locale === 'ar' ? 'منتجاتنا' : 'Featured products')
  const columns = String(section.settings.columns ?? 3)
  const columnClass = GRID_BY_COLUMNS[columns] ?? GRID_BY_COLUMNS['3']
  const products = Array.isArray(section.settings.products) ? section.settings.products : []
  const legacyCount = Number(section.settings.count ?? 0)
  const count = products.length > 0 ? products.length : Math.max(1, Math.min(legacyCount || 3, 12))

  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            {locale === 'ar' ? 'منتجات مختارة' : 'Selected collection'}
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight">{title}</h2>
        </div>
      </div>
      <div className={`grid gap-5 ${columnClass}`}>
        {Array.from({ length: count }, (_, index) => (
          <article key={index} className="group overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
            <div className="relative aspect-[4/3] bg-gradient-to-br from-primary/15 via-muted to-secondary">
              <div className="absolute inset-0 grid place-items-center text-5xl font-bold text-primary/20">
                {String(index + 1).padStart(2, '0')}
              </div>
              <span className="absolute start-4 top-4 rounded-full bg-background/85 px-3 py-1 text-xs font-semibold">
                {locale === 'ar' ? 'مميز' : 'Featured'}
              </span>
            </div>
            <div className="p-5">
              <div className="h-4 w-2/3 rounded bg-muted" />
              <div className="mt-4 flex items-center justify-between">
                <div className="h-3 w-1/3 rounded bg-muted" />
                <div className="h-5 w-1/4 rounded bg-muted" />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
