import { z } from 'zod'

const FunnelSlotSchema = z.object({
  product_ulid: z.string(),
  price: z.union([z.string(), z.number()]).nullable().optional(),
  original_price: z.union([z.string(), z.number()]).nullable().optional(),
  timer_minutes: z.number().nullable().optional(),
  headline: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  score_threshold: z.number().nullable().optional(),
}).nullable()

export const FunnelConfigSchema = z.object({
  product_ulid: z.string(),
  tripwire: FunnelSlotSchema,
  bump: FunnelSlotSchema,
  oto: FunnelSlotSchema,
  downsell: FunnelSlotSchema,
  premium_bridge: FunnelSlotSchema,
})
export type FunnelConfig = z.infer<typeof FunnelConfigSchema>

export const UpsertFunnelConfigSchema = z.object({
  tripwire_ulid: z.string().length(26).nullable().optional(),
  tripwire_price: z.number().min(0).nullable().optional(),
  bump_ulid: z.string().length(26).nullable().optional(),
  bump_price: z.number().min(0).nullable().optional(),
  oto_ulid: z.string().length(26).nullable().optional(),
  oto_price: z.number().min(0).nullable().optional(),
  oto_original_price: z.number().min(0).nullable().optional(),
  oto_timer_minutes: z.number().int().min(5).max(60).nullable().optional(),
  downsell_ulid: z.string().length(26).nullable().optional(),
  downsell_price: z.number().min(0).nullable().optional(),
  premium_bridge_ulid: z.string().length(26).nullable().optional(),
  premium_score_threshold: z.number().int().min(0).nullable().optional(),
  translations: z.object({
    ar: z.object({
      tripwire_headline: z.string().max(300).nullable().optional(),
      bump_headline: z.string().max(300).nullable().optional(),
      bump_description: z.string().nullable().optional(),
      oto_headline: z.string().max(300).nullable().optional(),
      downsell_headline: z.string().max(300).nullable().optional(),
    }).optional(),
  }).optional(),
})
export type UpsertFunnelConfigInput = z.infer<typeof UpsertFunnelConfigSchema>
