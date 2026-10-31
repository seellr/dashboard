import type { Locale, SectionInstance } from '@/shared/types/builder'

export function SectionFallback({ section, locale }: { section: SectionInstance; locale: Locale }) {
  return <section className="mx-6 my-4 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">{locale === 'ar' ? `نوع القسم غير مدعوم: ${section.type}` : `Unsupported section type: ${section.type}`}</section>
}
