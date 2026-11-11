import { z } from 'zod'

const localizedValueSchema = z.object({ ar: z.string(), en: z.string() })

/** The API localizes labels for us, but older docs show `{ ar, en }` objects. */
const textualLabelSchema = z.union([z.string(), localizedValueSchema])

const settingValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.record(z.string(), z.unknown()),
  z.array(z.unknown()),
])

function labelToString(value: unknown, fallback: string): string {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') {
    const localized = value as { ar?: unknown; en?: unknown }
    if (typeof localized.en === 'string' && localized.en) return localized.en
    if (typeof localized.ar === 'string' && localized.ar) return localized.ar
  }
  return fallback
}

const settingOptionSchema = z
  .object({
    value: z.union([z.string(), z.number()]).transform((value) => String(value)),
    label: textualLabelSchema.optional(),
  })
  .transform((option) => ({
    value: option.value,
    label: labelToString(option.label, option.value),
  }))

const settingDefinitionSchema = z
  .object({
    key: z.string(),
    type: z.string(),
    label: textualLabelSchema.optional(),
    help: z.string().nullable().optional(),
    default: z.unknown().optional(),
    translatable: z.boolean().optional(),
    required: z.boolean().optional(),
    min: z.number().nullable().optional(),
    max: z.number().nullable().optional(),
    step: z.number().nullable().optional(),
    options: z.array(settingOptionSchema).optional(),
  })
  .transform((definition) => ({
    key: definition.key,
    type: definition.type,
    label: labelToString(definition.label, definition.key),
    help: definition.help ?? null,
    default: definition.default ?? null,
    translatable: definition.translatable ?? false,
    required: definition.required ?? false,
    min: definition.min ?? null,
    max: definition.max ?? null,
    step: definition.step ?? null,
    options: definition.options ?? [],
  }))

const blockDefinitionSchema = z.object({
  handle: z.string(),
  name: z.string(),
  limit: z.number().nullable().optional(),
  settings: z.array(settingDefinitionSchema).optional().default([]),
})

const sectionDefinitionSchema = z.object({
  handle: z.string(),
  name: z.string(),
  max_blocks: z.number().nullable().optional(),
  limit_per_page: z.number().nullable().optional(),
  page_types: z.array(z.string()).optional().default([]),
  settings: z.array(settingDefinitionSchema).optional().default([]),
  blocks: z.array(blockDefinitionSchema).optional().default([]),
})

const themeDescriptorSchema = z.object({
  ulid: z.string(),
  handle: z.string(),
  version: z.string().nullable().optional(),
  name: z.string(),
})

export const themeSchemaResponseSchema = z.object({
  theme: themeDescriptorSchema.optional(),
  settings: z.array(settingDefinitionSchema).optional().default([]),
  sections: z.array(sectionDefinitionSchema).optional().default([]),
  fonts: z.array(z.string()).optional().default([]),
  locales: z.array(z.string()).optional().default([]),
})

const localizedValueFromText = textualLabelSchema.transform((value) =>
  typeof value === 'string' ? { ar: value, en: value } : value,
)

const sectionInstanceSchema = z.object({
  id: z.string(),
  type: z.string().optional(),
  handle: z.string().optional(),
  settings: z.record(z.string(), settingValueSchema).optional().default({}),
  blocks: z
    .array(
      z.object({
        id: z.string().optional(),
        type: z.string().optional(),
        handle: z.string().optional(),
        settings: z.record(z.string(), settingValueSchema).optional().default({}),
        hidden: z.boolean().optional(),
      }),
    )
    .optional(),
  hidden: z.boolean().optional(),
})

export const builderPageSchema = z.object({
  ulid: z.string(),
  type: z.string(),
  slug: z.string().optional(),
  name: localizedValueFromText,
  sections: z.array(sectionInstanceSchema).optional().default([]),
}).transform((page) => ({
  ...page,
  sections: page.sections.map((section, index) => ({
    ...section,
    id: section.id || `section-${index}`,
    type: section.type ?? section.handle ?? 'section',
    blocks: section.blocks?.map((block, blockIndex) => ({
      ...block,
      id: block.id || `block-${index}-${blockIndex}`,
      type: block.type ?? block.handle ?? 'block',
    })),
  })),
}))

export const builderPageListSchema = z.array(builderPageSchema)
