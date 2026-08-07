import { z } from 'zod'

export const EmailSequenceStepSchema = z.object({
  id: z.number(),
  delay_hours: z.number(),
  subject: z.string(),
  body_html: z.string(),
  sort_order: z.number(),
})
export type EmailSequenceStep = z.infer<typeof EmailSequenceStepSchema>

export const EmailSequenceSchema = z.object({
  ulid: z.string(),
  name: z.string(),
  trigger: z.string(),
  active: z.boolean(),
  steps: z.array(EmailSequenceStepSchema).optional(),
  created_at: z.string(),
})
export type EmailSequence = z.infer<typeof EmailSequenceSchema>

export const CreateEmailSequenceSchema = z.object({
  name: z.string().min(1),
  trigger: z.string().min(1),
  active: z.boolean(),
})
export type CreateEmailSequenceInput = z.infer<typeof CreateEmailSequenceSchema>

export const CreateEmailStepSchema = z.object({
  delay_hours: z.number().int().min(0),
  subject: z.string().min(1),
  body_html: z.string().min(1),
  sort_order: z.number().int().min(1),
})
export type CreateEmailStepInput = z.infer<typeof CreateEmailStepSchema>
