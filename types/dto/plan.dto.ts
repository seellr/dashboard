import { z } from 'zod'

const LocalizedTextSchema = z.object({
  ar: z.string(),
  en: z.string(),
})

const NameSchema = z.union([z.string(), LocalizedTextSchema]).nullish()

export const PlanSchema = z.object({
  ulid: z.string().nullish(),
  slug: z.string().nullish(),
  name: NameSchema,
  description: z.union([z.string(), LocalizedTextSchema]).nullish(),
  price: z.union([z.string(), z.number()]).nullish(),
  price_monthly: z.union([z.string(), z.number()]).nullish(),
  price_annual: z.union([z.string(), z.number()]).nullish(),
  monthly_price: z.union([z.string(), z.number()]).nullish(),
  annual_price: z.union([z.string(), z.number()]).nullish(),
  currency: z.string().nullish(),
  max_sites: z.number().nullish(),
  max_products: z.number().nullish(),
  trial_days: z.number().nullish(),
  is_active: z.boolean().optional(),
  active: z.boolean().optional(),
  features: z.array(z.unknown()).optional(),
})

export type Plan = z.infer<typeof PlanSchema>

export const PLAN_STATUS = {
  Trial: 1,
  Active: 2,
  Cancelled: 3,
  Expired: 4,
} as const

export const PLAN_STATUS_LABELS: Record<number, string> = {
  [PLAN_STATUS.Trial]: 'Trial',
  [PLAN_STATUS.Active]: 'Active',
  [PLAN_STATUS.Cancelled]: 'Cancelled',
  [PLAN_STATUS.Expired]: 'Expired',
}
