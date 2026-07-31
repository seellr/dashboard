import { z } from 'zod'

export const AiToolFieldOptionSchema = z.object({
  ulid: z.string(),
  label: z.string(),
  value: z.string(),
})
export type AiToolFieldOption = z.infer<typeof AiToolFieldOptionSchema>

export const AiToolFieldSchema = z.object({
  ulid: z.string(),
  field_key: z.string(),
  field_type: z.string(),
  required: z.boolean(),
  sort_order: z.number(),
  label: z.string(),
  options: z.array(AiToolFieldOptionSchema).optional(),
})
export type AiToolField = z.infer<typeof AiToolFieldSchema>

export const AiToolSchema = z.object({
  ulid: z.string(),
  slug: z.string(),
  name: z.string(),
  prompt_template: z.string().optional(),
  openrouter_model: z.string().optional(),
  max_tokens: z.number().optional(),
  rate_limit_per_day: z.number().optional(),
  active: z.boolean(),
  fields: z.array(AiToolFieldSchema).optional(),
  created_at: z.string(),
})
export type AiTool = z.infer<typeof AiToolSchema>

export const AiToolRunSchema = z.object({
  ulid: z.string(),
  output: z.string().nullable(),
  tokens_used: z.number().nullable(),
  model_used: z.string().nullable(),
  created_at: z.string(),
  inputs: z.array(z.object({ field_key: z.string(), field_value: z.string() })),
})
export type AiToolRun = z.infer<typeof AiToolRunSchema>
