import type { Locale, SectionInstance } from '@/shared/types/builder'
export function SpacerSection({ section }: { section: SectionInstance; locale: Locale }) { const height = Number(section.settings.height ?? 48); return <div aria-hidden="true" style={{ height: Math.max(8, Math.min(height, 320)) }} /> }
