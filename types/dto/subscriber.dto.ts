import { z } from 'zod'

export const EnumLabelSchema = z.object({
  id: z.union([z.number(), z.string()]),
  label: z.string(),
})

export type EnumLabel = z.infer<typeof EnumLabelSchema>

export const SubscriberSchema = z.object({
  ulid: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string(),
  phone: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  email_verified_at: z.string().nullable().optional(),
  status: z.union([EnumLabelSchema, z.number()]).nullable().optional(),
  plan_status: z.union([EnumLabelSchema, z.number()]).nullable().optional(),
  trial_ends_at: z.string().nullable().optional(),
  subscription_ends_at: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
})

export type Subscriber = z.infer<typeof SubscriberSchema>

export const SubscriberListMetaSchema = z.object({
  per_page: z.number().optional(),
  next_cursor: z.string().nullable().optional(),
  has_more: z.boolean(),
})

export const SubscriberEnvelopeSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: SubscriberSchema,
  error_code: z.string().optional(),
  errors: z.record(z.string(), z.array(z.string())).optional(),
})

export type SubscriberEnvelope = z.infer<typeof SubscriberEnvelopeSchema>
