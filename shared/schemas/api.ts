import { z } from 'zod'

export const apiEnvelopeSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.unknown().optional(),
  error_code: z.string().optional(),
  errors: z.record(z.string(), z.array(z.string())).optional(),
  meta: z.object({ next_cursor: z.string().nullable().optional(), has_more: z.boolean() }).optional(),
})

export type ApiEnvelopeInput = z.infer<typeof apiEnvelopeSchema>
