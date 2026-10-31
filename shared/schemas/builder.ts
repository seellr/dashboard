import { z } from 'zod'

const localizedValueSchema = z.object({ ar: z.string(), en: z.string() })
const settingValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null(), z.record(z.string(), z.unknown())])

export const builderPageSchema = z.object({
  ulid: z.string(),
  type: z.string(),
  slug: z.string().optional(),
  name: localizedValueSchema,
  sections: z.array(z.object({
    id: z.string(),
    type: z.string(),
    settings: z.record(z.string(), settingValueSchema),
    blocks: z.array(z.object({ id: z.string(), type: z.string(), settings: z.record(z.string(), settingValueSchema), hidden: z.boolean().optional() })).optional(),
    hidden: z.boolean().optional(),
  })),
})

export const builderPageListSchema = z.array(builderPageSchema)

export const themeSchemaResponseSchema = z.object({
  sections: z.array(z.object({
    type: z.string(),
    label: localizedValueSchema,
    settings: z.array(z.object({ key: z.string(), label: localizedValueSchema, type: z.enum(['color', 'font', 'toggle', 'select', 'text', 'image']), translatable: z.boolean().optional(), required: z.boolean().optional(), options: z.array(z.object({ value: z.string(), label: localizedValueSchema })).optional(), default_value: settingValueSchema.optional() })),
    blocks: z.array(z.object({ type: z.string(), label: localizedValueSchema, settings: z.array(z.unknown()) })).optional(),
  })),
})
