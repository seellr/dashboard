import type { BuilderPage, Locale, ThemeRuntimeSettings, ThemeSchema } from './builder'

export const PREVIEW_SOURCE = 'seller-theme-preview'
export const PREVIEW_PROTOCOL_VERSION = 1

export type EditorToPreviewMessage =
  | { source: typeof PREVIEW_SOURCE; v: typeof PREVIEW_PROTOCOL_VERSION; type: 'INIT'; page: BuilderPage; schema: ThemeSchema; themeSettings: ThemeRuntimeSettings; locale: Locale }
  | { source: typeof PREVIEW_SOURCE; v: typeof PREVIEW_PROTOCOL_VERSION; type: 'UPDATE_PAGE'; page: BuilderPage }
  | { source: typeof PREVIEW_SOURCE; v: typeof PREVIEW_PROTOCOL_VERSION; type: 'UPDATE_SETTINGS'; themeSettings: ThemeRuntimeSettings }
  | { source: typeof PREVIEW_SOURCE; v: typeof PREVIEW_PROTOCOL_VERSION; type: 'SELECT_SECTION'; sectionId: string | null }
  | { source: typeof PREVIEW_SOURCE; v: typeof PREVIEW_PROTOCOL_VERSION; type: 'SET_LOCALE'; locale: Locale }

export type PreviewToEditorMessage =
  | { source: typeof PREVIEW_SOURCE; v: typeof PREVIEW_PROTOCOL_VERSION; type: 'READY' }
  | { source: typeof PREVIEW_SOURCE; v: typeof PREVIEW_PROTOCOL_VERSION; type: 'SECTION_CLICKED'; sectionId: string }
  | { source: typeof PREVIEW_SOURCE; v: typeof PREVIEW_PROTOCOL_VERSION; type: 'SECTION_HOVERED'; sectionId: string | null }
  | { source: typeof PREVIEW_SOURCE; v: typeof PREVIEW_PROTOCOL_VERSION; type: 'ERROR'; message: string }

export function isPreviewMessage(value: unknown): value is { source: typeof PREVIEW_SOURCE; type: string } {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as { source?: unknown; v?: unknown; type?: unknown }
  return candidate.source === PREVIEW_SOURCE && candidate.v === PREVIEW_PROTOCOL_VERSION && typeof candidate.type === 'string'
}

export function getAllowedOrigins(): string[] {
  if (typeof window === 'undefined') return []
  const configured = process.env.NEXT_PUBLIC_PREVIEW_EDITOR_ORIGINS?.split(',').map((origin) => origin.trim()).filter(Boolean) ?? []
  return configured.length > 0 ? configured : [window.location.origin]
}

export function isAllowedOrigin(origin: string, allowedOrigins: string[]): boolean {
  return allowedOrigins.includes(origin)
}
