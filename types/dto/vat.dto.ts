import { z } from 'zod'

export const VatConfigSchema = z.object({
  vat_rate: z.number(),
  vat_label: z.string(),
  vat_inclusive: z.boolean(),
  vat_enabled: z.boolean(),
})
export type VatConfig = z.infer<typeof VatConfigSchema>
