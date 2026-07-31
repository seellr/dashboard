import { z } from 'zod'

export const FunnelTemplateSchema = z.object({
  ulid: z.string(),
  name: z.string(),
  brand_id: z.number(),
  active: z.boolean(),
  tripwire_price: z.union([z.string(), z.number()]).nullable(),
  tripwire_product_ulid: z.string().nullable(),
  bump_price: z.union([z.string(), z.number()]).nullable(),
  bump_product_ulid: z.string().nullable(),
  oto_price: z.union([z.string(), z.number()]).nullable(),
  oto_product_ulid: z.string().nullable(),
  downsell_price: z.union([z.string(), z.number()]).nullable(),
  downsell_product_ulid: z.string().nullable(),
  premium_bridge_redirect_url: z.string().nullable(),
  created_at: z.string(),
})
export type FunnelTemplate = z.infer<typeof FunnelTemplateSchema>

export const CreateFunnelTemplateSchema = z.object({
  name: z.string().min(1),
  active: z.boolean(),
  tripwire_price: z.number().nullable().optional(),
  tripwire_product_ulid: z.string().nullable().optional(),
  bump_price: z.number().nullable().optional(),
  bump_product_ulid: z.string().nullable().optional(),
  oto_price: z.number().nullable().optional(),
  oto_product_ulid: z.string().nullable().optional(),
  downsell_price: z.number().nullable().optional(),
  downsell_product_ulid: z.string().nullable().optional(),
  premium_bridge_redirect_url: z.string().url().nullable().optional(),
})
export type CreateFunnelTemplateInput = z.infer<typeof CreateFunnelTemplateSchema>
