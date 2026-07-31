import { z } from 'zod'

export const CouponTypeValues = [1, 2] as const
export const CouponTypeLabels: Record<number, string> = { 1: 'Percent', 2: 'Fixed' }

const EnumLabelSchema = z.object({ id: z.number(), label: z.string() })

export const CouponSchema = z.object({
  ulid: z.string(),
  code: z.string(),
  type: EnumLabelSchema,
  value: z.union([z.string(), z.number()]),
  max_uses: z.number().nullable(),
  used_count: z.number(),
  active: z.boolean(),
  expires_at: z.string().nullable(),
})
export type Coupon = z.infer<typeof CouponSchema>

export const CreateCouponSchema = z.object({
  code: z.string().min(3).max(50).regex(/^[A-Za-z0-9_-]+$/, 'invalid_code'),
  type: z.number().refine((v) => (CouponTypeValues as readonly number[]).includes(v), 'invalid_type'),
  value: z.number().min(0.01).max(999999.99),
  max_uses: z.number().int().min(1).max(1000000).nullable().optional(),
  product_id: z.string().length(26).nullable().optional(),
  expires_at: z.string().nullable().optional(),
  active: z.boolean().optional(),
})
export type CreateCouponInput = z.infer<typeof CreateCouponSchema>
