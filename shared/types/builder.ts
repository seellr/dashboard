import type { z } from 'zod'

export type Locale = 'ar' | 'en'

export type PageType =
  | 'home'
  | 'product'
  | 'product_list'
  | 'cart'
  | 'account'
  | '404'
  | 'header'
  | 'footer'
  | 'lead_magnet'
  | 'tripwire'
  | 'oto'
  | 'downsell'
  | 'thank_you'
  | 'custom'

export type SettingValue = string | number | boolean | null | MediaReference

export interface MediaReference {
  ulid: string
  url: string
  thumb_url?: string
}

export interface LocalizedValue {
  ar: string
  en: string
}

export type SettingType = 'color' | 'font' | 'toggle' | 'select' | 'text' | 'image'

export interface SettingDefinition {
  key: string
  label: LocalizedValue
  type: SettingType
  translatable?: boolean
  required?: boolean
  options?: Array<{ value: string; label: LocalizedValue }>
  default_value?: SettingValue
  // TODO: confirm backend constraints for min/max, formats, and image metadata.
}

export interface BlockDefinition {
  type: string
  label: LocalizedValue
  settings: SettingDefinition[]
}

export interface SectionDefinition {
  type: string
  label: LocalizedValue
  settings: SettingDefinition[]
  blocks?: BlockDefinition[]
}

export interface ThemeSchema {
  sections: SectionDefinition[]
  // TODO: confirm whether theme-level settings are returned separately.
  theme_settings?: SettingDefinition[]
}

export interface ThemeRuntimeSettings {
  primary_color?: string
  secondary_color?: string
  background_color?: string
  foreground_color?: string
  heading_font?: string
  body_font?: string
  [key: string]: string | undefined
}

export interface BlockInstance {
  id: string
  type: string
  settings: Record<string, SettingValue | LocalizedValue>
  hidden?: boolean
}

export interface SectionInstance {
  id: string
  type: string
  settings: Record<string, SettingValue | LocalizedValue>
  blocks?: BlockInstance[]
  hidden?: boolean
}

export interface BuilderPage {
  ulid: string
  type: PageType
  slug?: string
  name: LocalizedValue
  sections: SectionInstance[]
  // TODO: confirm draft version and publication metadata fields.
}

export interface ThemeSummary {
  ulid: string
  slug: string
  status: { id: string | number; label: string }
  name: LocalizedValue
  description?: LocalizedValue
  preview_url?: string
  settings: SettingDefinition[]
  created_at: string
}

export interface SubscriberTheme {
  theme_ulid: string
  theme_name: LocalizedValue
  activated_at: string
  settings: Record<string, SettingValue | LocalizedValue>[]
}

export interface PreviewTokenResponse {
  token: string
  expires_at?: string
  // TODO: confirm whether the backend returns a ready-made share URL.
  url?: string
}

export interface CursorMeta {
  next_cursor?: string | null
  has_more: boolean
}

export interface ApiEnvelope<T> {
  success: boolean
  message?: string
  data?: T
  error_code?: string
  errors?: Record<string, string[]>
  meta?: CursorMeta
}

export type BuilderFormSchema = z.ZodType<Record<string, unknown>>
