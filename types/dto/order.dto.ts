import { z } from 'zod'

const EnumLabelSchema = z.object({ id: z.number(), label: z.string() })

export const OrderSchema = z.object({
  ulid: z.string(),
  invoice_number: z.string().nullable(),
  status: EnumLabelSchema,
  subtotal: z.union([z.string(), z.number()]),
  discount_amount: z.union([z.string(), z.number()]),
  vat_amount: z.union([z.string(), z.number()]),
  total: z.union([z.string(), z.number()]),
  currency: z.string(),
  payment_method: EnumLabelSchema,
  payment_gateway: EnumLabelSchema.nullable(),
  requires_shipping: z.boolean(),
  created_at: z.string(),
})
export type Order = z.infer<typeof OrderSchema>
