import { z } from 'zod'

const LocalizedTextSchema = z.object({
  ar: z.string(),
  en: z.string(),
})

export const PlanSchema = z.object({
  ulid: z.string().optional(),
  slug: z.string().optional(),
  name: z.union([z.string(), LocalizedTextSchema]).optional(),
  description: z.union([z.string(), LocalizedTextSchema]).nullable().optional(),
  price: z.union([z.string(), z.number()]).nullable().optional(),
  currency: z.string().nullable().optional(),
  max_sites: z.number().nullable().optional(),
  max_products: z.number().nullable().optional(),
  trial_days: z.number().nullable().optional(),
  is_active: z.boolean().optional(),
})

export type Plan = z.infer<typeof PlanSchema>

export const PLAN_STATUS = {
  Trial: 1,
  Active: 2,
  Cancelled: 3,
  Expired: 4,
} as const
