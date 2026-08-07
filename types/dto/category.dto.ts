import { z } from 'zod'

export const CategorySchema = z.object({
  ulid: z.string(),
  slug: z.string(),
  brand_id: z.number(),
  parent_ulid: z.string().nullable(),
  sort_order: z.number(),
  active: z.boolean(),
  name: z.string(),
  description: z.string().nullable(),
})
export type Category = z.infer<typeof CategorySchema>

export const CreateCategorySchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  sort_order: z.number().int().min(0),
  active: z.boolean(),
  translations: z.object({
    ar: z.object({ name: z.string().min(1), description: z.string().nullable().optional() }),
    en: z.object({ name: z.string().min(1), description: z.string().nullable().optional() }).optional(),
  }),
})
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>
