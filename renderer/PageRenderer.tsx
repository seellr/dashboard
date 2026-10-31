import type { CSSProperties } from 'react'
import type { BuilderPage, Locale, ThemeRuntimeSettings } from '@/shared/types/builder'
import { getSectionComponent } from './section-registry'

interface PageRendererProps {
  page: BuilderPage
  locale: Locale
  themeSettings?: ThemeRuntimeSettings
  selectedSectionId?: string | null
  onSectionClick?: (sectionId: string) => void
}

function themeVariables(settings: ThemeRuntimeSettings): CSSProperties {
  return {
    '--theme-primary': settings.primary_color ?? '#2563eb',
    '--theme-secondary': settings.secondary_color ?? '#e5e7eb',
    '--theme-background': settings.background_color ?? '#ffffff',
    '--theme-foreground': settings.foreground_color ?? '#111827',
    '--theme-font-heading': settings.heading_font ?? 'inherit',
    '--theme-font-body': settings.body_font ?? 'inherit',
  } as CSSProperties
}

export function PageRenderer({ page, locale, themeSettings = {}, selectedSectionId, onSectionClick }: PageRendererProps) {
  return <main dir={locale === 'ar' ? 'rtl' : 'ltr'} lang={locale} style={themeVariables(themeSettings)} className="min-h-full bg-[var(--theme-background)] text-[var(--theme-foreground)] [font-family:var(--theme-font-body)]"><div className="[font-family:var(--theme-font-heading)]">{page.sections.filter((section) => !section.hidden).map((section) => { const Component = getSectionComponent(section.type); return <div key={section.id} data-section-id={section.id} data-selected={selectedSectionId === section.id || undefined} className={selectedSectionId === section.id ? 'relative outline-2 outline-primary outline-offset-[-2px]' : undefined} onClick={() => onSectionClick?.(section.id)}><Component section={section} locale={locale} /></div> })}</div></main>
}
