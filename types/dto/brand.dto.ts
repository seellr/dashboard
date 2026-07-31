import { z } from 'zod'

export const BrandConfigSchema = z.object({
  logo_url: z.string().nullable(),
  favicon_url: z.string().nullable(),
  primary_color: z.string().nullable(),
  secondary_color: z.string().nullable(),
  bg_color: z.string().nullable(),
  text_color: z.string().nullable(),
  font_heading: z.string().nullable(),
  font_body: z.string().nullable(),
  currency: z.string().nullable(),
})
export type BrandConfig = z.infer<typeof BrandConfigSchema>

export const BrandSchema = z.object({
  ulid: z.string(),
  name: z.string(),
  slug: z.string(),
  domain: z.string(),
  active: z.boolean(),
  config: BrandConfigSchema,
})
export type Brand = z.infer<typeof BrandSchema>
