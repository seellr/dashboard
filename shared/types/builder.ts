import type { z } from 'zod'

export type Locale = 'ar' | 'en'

export type PageType =
  | 'home'
  | 'product'
  | 'product_list'
  | 'cart'
  | 'account'
  | '404'
  | 'not_found'
  | 'header'
  | 'footer'
  | 'lead_magnet'
  | 'tripwire'
  | 'oto'
  | 'downsell'
  | 'thank_you'
  | 'custom'

export interface MediaReference {
  ulid: string
  url: string
  thumb_url?: string
}

export interface LocalizedValue {
  ar: string
  en: string
}

/**
 * Values stored in a page section/block. The builder keeps this intentionally
 * broad because the documented schema allows localized objects, numbers,
 * booleans, media references and lists (for `product_list` settings).
 */
export type SettingValue =
  | string
  | number
  | boolean
  | null
  | MediaReference
  | LocalizedValue
  | SettingValue[]
  | { [key: string]: unknown }

/** Setting types returned by `GET /subscriber/theme/schema`. */
export type SettingType =
  | 'text'
  | 'textarea'
  | 'richtext'
  | 'url'
  | 'number'
  | 'range'
  | 'toggle'
  | 'color'
  | 'font'
  | 'select'
  | 'image'
  | 'product'
  | 'product_list'

export interface SettingOption {
  value: string
  label: string
}

/**
 * Matches the live `GET /subscriber/theme/schema` setting definition:
 * `{ key, type, label, help, default, translatable, required, min, max, step, options }`.
 * Labels/options are plain strings (already localized by the API) and the
 * default value lives under `default` (not `default_value`).
 */
export interface SettingDefinition {
  key: string
  type: SettingType
  label: string
  help?: string | null
  default?: SettingValue
  translatable?: boolean
  required?: boolean
  min?: number | null
  max?: number | null
  step?: number | null
  options?: SettingOption[]
}

export interface BlockDefinition {
  handle: string
  name: string
  limit?: number | null
  settings: SettingDefinition[]
}

export interface SectionDefinition {
  handle: string
  name: string
  max_blocks?: number | null
  limit_per_page?: number | null
  page_types?: string[]
  settings: SettingDefinition[]
  blocks?: BlockDefinition[]
}

export interface ThemeDescriptor {
  ulid: string
  handle: string
  version?: string | null
  name: string
}

export interface ThemeSchema {
  theme?: ThemeDescriptor
  settings: SettingDefinition[]
  sections: SectionDefinition[]
  fonts?: string[]
  locales?: string[]
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
  /** Backend ULID; absent for blocks created in the editor before the first save. */
  ulid?: string
  id: string
  type: string
  settings: Record<string, SettingValue>
  hidden?: boolean
}

export interface SectionInstance {
  /** Backend ULID; absent for sections created in the editor before the first save. */
  ulid?: string
  id: string
  type: string
  settings: Record<string, SettingValue>
  blocks?: BlockInstance[]
  hidden?: boolean
}

export interface BuilderPage {
  ulid: string
  type: PageType
  slug?: string
  name: LocalizedValue
  sections: SectionInstance[]
}

/**
 * Theme summary returned by `GET /themes` and `GET /themes/{ulid}`.
 * `name`/`description` are already localized by the API (plain strings).
 */
export interface ThemeSummary {
  ulid: string
  slug: string
  status: { id: string | number; label: string }
  name: string
  description?: string | null
  preview_url?: string | null
  version?: string | null
  has_manifest?: boolean
  settings?: SettingDefinition[] | null
  created_at: string
}

/**
 * Response from `GET /subscriber/theme` (live) and the documented
 * `theme_ulid/theme_name/activated_at/settings` shape. Both are supported.
 */
export interface SubscriberTheme {
  theme?: ThemeDescriptor
  has_unpublished_changes?: boolean
  published_at?: string | null
  theme_ulid?: string
  theme_name?: string | LocalizedValue
  activated_at?: string
  settings?: Record<string, SettingValue> | SettingDefinition[] | null
}

export interface PreviewTokenResponse {
  token: string
  expires_at?: string
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
