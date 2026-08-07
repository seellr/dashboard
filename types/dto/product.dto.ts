import { z } from 'zod'

export const ProductTypeValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] as const
export const ProductTypeLabels: Record<number, string> = {
  1: 'Ebook', 2: 'Template', 3: 'Playbook', 4: 'Notion System', 5: 'Prompts Pack',
  6: 'Bundle', 7: 'Course', 8: 'AI Tool', 9: 'Quiz', 10: 'Audio', 11: 'Membership',
  12: 'Challenge', 13: 'Consultation',
}

const EnumLabelSchema = z.object({ id: z.number(), label: z.string() })

export const ProductTranslationSchema = z.object({
  name: z.string().min(1).max(200),
  one_liner: z.string().max(300).nullable().optional(),
})

export const ProductTranslationsSchema = z.object({
  ar: ProductTranslationSchema,
  en: ProductTranslationSchema.partial().optional(),
})

// ── Response shape (GET) ────────────────────────────────────────────────────
export const ProductSchema = z.object({
  ulid: z.string(),
  slug: z.string(),
  brand_id: z.number().nullable(),
  internal_name: z.string(),
  sku: z.string(),
  type: EnumLabelSchema,
  status: EnumLabelSchema.nullable(),
  base_price: z.union([z.string(), z.number()]),
  sale_price: z.union([z.string(), z.number()]).nullable(),
  currency: z.string(),
  vat_rule: EnumLabelSchema,
  coupon_eligible: z.boolean(),
  hero_image_url: z.string().nullable(),
  delivery_method: EnumLabelSchema,
  featured: z.boolean(),
  name: z.string(),
  one_liner: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})
export type Product = z.infer<typeof ProductSchema>

// ── Write shapes (POST/PUT) ─────────────────────────────────────────────────
export const CreateProductSchema = z.object({
  brand_id: z.number().int().min(1).nullable().optional(),
  internal_name: z.string().min(1).max(200),
  type: z.number().refine((v) => (ProductTypeValues as readonly number[]).includes(v), 'invalid_type'),
  delivery_method: z.number().int(),
  base_price: z.number().min(0).max(999999.99),
  sale_price: z.number().min(0).optional(),
  currency: z.string().length(3),
  vat_rule: z.number().int(),
  sku: z.string().max(80).regex(/^[A-Za-z0-9\-_]+$/, 'invalid_sku'),
  coupon_eligible: z.boolean(),
  featured: z.boolean(),
  translations: ProductTranslationsSchema,
})
export type CreateProductInput = z.infer<typeof CreateProductSchema>

export const UpdateProductSchema = CreateProductSchema.omit({ brand_id: true }).extend({
  status: z.number().int().optional(),
})
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>

// ── Sub-resource write shapes ───────────────────────────────────────────────
export interface ProductDescriptionInput {
  body_html?: string
  translations?: { ar?: { body_html?: string }; en?: { body_html?: string } }
}

export interface ProductSeoInput {
  meta_title?: string
  meta_description?: string
  og_image_url?: string
  translations?: {
    ar?: { meta_title?: string; meta_description?: string }
    en?: { meta_title?: string; meta_description?: string }
  }
}

export interface ProductDeliveryInput {
  delivery_method?: number
  download_limit?: number
  access_expiry_days?: number
  stream_url?: string
  redirect_url?: string
  requires_shipping?: boolean
}

export interface ProductAssetInput {
  [key: string]: unknown
}

export interface ProductTestimonialInput {
  author_name?: string
  name?: string
  body?: string
  rating?: number
  avatar_url?: string
  role?: string
  sort_order?: number
  translations?: Record<string, unknown>
  [key: string]: unknown
}

export interface ProductFaqInput {
  question?: string
  answer?: string
  sort_order?: number
  translations?: Record<string, unknown>
  [key: string]: unknown
}
