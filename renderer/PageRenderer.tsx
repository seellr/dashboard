import type { CSSProperties } from 'react'
import type { BuilderPage, Locale, ThemeRuntimeSettings } from '@/shared/types/builder'
import { cn } from '@/lib/utils'
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

function sectionsWithAnnouncementAtTop(sections: BuilderPage['sections']) {
  const visible = sections.filter((section) => !section.hidden)
  const announcements = visible.filter((section) => section.type === 'announcement')
  const rest = visible.filter((section) => section.type !== 'announcement')
  const headerIndex = rest.findIndex((section) => section.type === 'header')
  if (headerIndex < 0) return [...announcements, ...rest]
  return [...rest.slice(0, headerIndex), ...announcements, ...rest.slice(headerIndex)]
}

export function PageRenderer({
  page,
  locale,
  themeSettings = {},
  selectedSectionId,
  onSectionClick,
}: PageRendererProps) {
  const editable = Boolean(onSectionClick)

  return (
    <main
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      lang={locale}
      style={themeVariables(themeSettings)}
      className="min-h-full bg-[var(--theme-background)] text-[var(--theme-foreground)] [font-family:var(--theme-font-body)]"
    >
      <div className="[font-family:var(--theme-font-heading)]">
        {sectionsWithAnnouncementAtTop(page.sections).map((section) => {
          const Component = getSectionComponent(section.type)
          const isSelected = selectedSectionId === section.id

          return (
            <div
              key={section.id}
              data-section-id={section.id}
              data-section-type={section.type}
              data-selected={isSelected || undefined}
              className={cn(
                'relative transition-[box-shadow]',
                section.type === 'header' && 'sticky top-0 z-30',
                editable && 'cursor-pointer hover:outline-1 hover:outline-dashed hover:outline-primary/40 hover:outline-offset-[-2px]',
                isSelected && 'outline-2 outline-primary outline-offset-[-2px]',
              )}
              onClick={() => onSectionClick?.(section.id)}
            >
              <Component section={section} locale={locale} />
            </div>
          )
        })}
      </div>
    </main>
  )
}
