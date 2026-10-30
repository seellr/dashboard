import { z } from 'zod'

// ── Enumerations & Labels ───────────────────────────────────────────────────

export const ProductTypeValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] as const
export type ProductTypeValue = (typeof ProductTypeValues)[number]

export const ProductTypeLabels: Record<number, string> = {
  1: 'Ebook',
  2: 'Template',
  3: 'Playbook',
  4: 'Notion System',
  5: 'Prompts Pack',
  6: 'Bundle',
  7: 'Course',
  8: 'AI Tool',
  9: 'Quiz',
  10: 'Audio',
  11: 'Membership',
  12: 'Challenge',
  13: 'Consultation',
}

export const DeliveryMethodValues = [1, 2, 3, 4, 5, 6, 7, 8] as const
export type DeliveryMethodValue = (typeof DeliveryMethodValues)[number]

export const DeliveryMethodLabels: Record<number, string> = {
  1: 'File Download',
  2: 'External Link',
  3: 'Notion Link',
  4: 'Interactive',
  5: 'Discord Access',
  6: 'Telegram Access',
  7: 'Calendly Link',
  8: 'Physical',
}

export const ProductStatusValues = [1, 2, 3, 4, 5] as const
export type ProductStatusValue = (typeof ProductStatusValues)[number]

export const ProductStatusLabels: Record<number, string> = {
  1: 'Draft',
  2: 'Published',
  3: 'Archived',
  4: 'Coming Soon',
  5: 'Waitlist',
}

export const VatRuleValues = [1, 2, 3] as const
export type VatRuleValue = (typeof VatRuleValues)[number]

export const VatRuleLabels: Record<number, string> = {
  1: 'Included',
  2: 'Added',
  3: 'Exempt',
}

export const AssetTypeValues = [1, 2, 3, 4] as const
export const AssetTypeLabels: Record<number, string> = {
  1: 'File',
  2: 'Link',
  3: 'Notion URL',
  4: 'Prompt Item',
}

const EnumLabelSchema = z.object({
  id: z.number(),
  label: z.string(),
})

// ── Translation Schemas ─────────────────────────────────────────────────────

export const ProductBasicTranslationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name must not exceed 200 characters'),
  one_liner: z.string().max(300, 'One-liner must not exceed 300 characters').nullable().optional(),
})

export const ProductBasicTranslationsSchema = z.object({
  ar: ProductBasicTranslationSchema,
  en: ProductBasicTranslationSchema.partial().optional(),
})

// ── Create & Update Product Schemas ─────────────────────────────────────────

export const CreateProductSchema = z
  .object({
    internal_name: z
      .string()
      .min(1, 'Internal name is required')
      .max(200, 'Internal name must not exceed 200 characters'),
    type: z.number().refine((v) => (ProductTypeValues as readonly number[]).includes(v), {
      message: 'Invalid product type',
    }),
    delivery_method: z
      .number()
      .refine((v) => (DeliveryMethodValues as readonly number[]).includes(v), {
        message: 'Invalid delivery method',
      }),
    base_price: z
      .number({ invalid_type_error: 'Base price must be a number' })
      .min(0, 'Base price cannot be negative')
      .max(999999.99, 'Base price exceeds maximum limit'),
    sale_price: z
      .number({ invalid_type_error: 'Sale price must be a number' })
      .min(0, 'Sale price cannot be negative')
      .max(999999.99, 'Sale price exceeds maximum limit')
      .nullable()
      .optional(),
    currency: z
      .string()
      .length(3, 'Currency must be a 3-letter code (e.g. EGP, USD)')
      .regex(/^[A-Z]{3}$/, 'Currency must be uppercase 3 letters'),
    vat_rule: z.number().refine((v) => (VatRuleValues as readonly number[]).includes(v), {
      message: 'Invalid VAT rule',
    }),
    sku: z
      .string()
      .max(80, 'SKU must not exceed 80 characters')
      .regex(/^[A-Za-z0-9\-_]+$/, 'SKU may only contain letters, numbers, hyphens, and underscores')
      .optional()
      .or(z.literal('')),
    translations: ProductBasicTranslationsSchema,
    download_limit: z.number().int().min(1).max(1000).nullable().optional(),
    access_expiry_days: z.number().int().min(1).max(3650).nullable().optional(),
    coupon_eligible: z.boolean().optional(),
    crm_score_on_purchase: z.number().int().min(0).max(10000).nullable().optional(),
    sort_order: z.number().int().min(0).optional(),
    featured: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.sale_price !== undefined &&
      data.sale_price !== null &&
      data.sale_price >= data.base_price
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sale_price'],
        message: 'Sale price must be strictly less than base price',
      })
    }
  })

export type CreateProductInput = z.infer<typeof CreateProductSchema>

export const UpdateProductSchema = z
  .object({
    internal_name: z.string().min(1).max(200).optional(),
    type: z.number().refine((v) => (ProductTypeValues as readonly number[]).includes(v)).optional(),
    delivery_method: z.number().refine((v) => (DeliveryMethodValues as readonly number[]).includes(v)).optional(),
    base_price: z.number().min(0).max(999999.99).optional(),
    sale_price: z.number().min(0).max(999999.99).nullable().optional(),
    currency: z.string().length(3).regex(/^[A-Z]{3}$/).optional(),
    vat_rule: z.number().refine((v) => (VatRuleValues as readonly number[]).includes(v)).optional(),
    status: z.number().refine((v) => (ProductStatusValues as readonly number[]).includes(v)).optional(),
    sku: z
      .string()
      .max(80)
      .regex(/^[A-Za-z0-9\-_]+$/)
      .optional()
      .or(z.literal('')),
    translations: z
      .object({
        ar: ProductBasicTranslationSchema.partial().optional(),
        en: ProductBasicTranslationSchema.partial().optional(),
      })
      .optional(),
    download_limit: z.number().int().min(1).max(1000).nullable().optional(),
    access_expiry_days: z.number().int().min(1).max(3650).nullable().optional(),
    coupon_eligible: z.boolean().optional(),
    crm_score_on_purchase: z.number().int().min(0).max(10000).nullable().optional(),
    sort_order: z.number().int().min(0).optional(),
    featured: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.base_price !== undefined &&
      data.sale_price !== undefined &&
      data.sale_price !== null &&
      data.sale_price >= data.base_price
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sale_price'],
        message: 'Sale price must be strictly less than base price',
      })
    }
  })

export type UpdateProductInput = z.infer<typeof UpdateProductSchema>

// ── Sub-resource Schemas ────────────────────────────────────────────────────

// 1) Description
export const ProductDescriptionLocaleSchema = z.object({
  one_liner: z.string().max(300).nullable().optional(),
  target_audience: z.string().max(1000).nullable().optional(),
  pain_point: z.string().max(1000).nullable().optional(),
  outcome: z.string().max(1000).nullable().optional(),
  full_description: z.string().max(10000).nullable().optional(),
  what_you_get: z.string().max(5000).nullable().optional(),
  refund_policy: z.string().max(2000).nullable().optional(),
})

export const ProductDescriptionSchema = z.object({
  difficulty: z.string().max(80).nullable().optional(),
  time_to_value: z.string().max(80).nullable().optional(),
  translations: z.object({
    ar: ProductDescriptionLocaleSchema,
    en: ProductDescriptionLocaleSchema.optional(),
  }),
})

export type ProductDescriptionInput = z.infer<typeof ProductDescriptionSchema>

// 2) SEO
export const ProductSeoLocaleSchema = z.object({
  meta_title: z.string().max(160).nullable().optional(),
  meta_description: z.string().max(320).nullable().optional(),
})

export const ProductSeoSchema = z.object({
  og_image_url: z.string().max(500).nullable().optional(),
  canonical_url: z.string().url('Invalid canonical URL').max(500).nullable().optional().or(z.literal('')),
  schema_type: z.string().max(80).nullable().optional(),
  translations: z.object({
    ar: ProductSeoLocaleSchema,
    en: ProductSeoLocaleSchema.optional(),
  }),
})

export type ProductSeoInput = z.infer<typeof ProductSeoSchema>

// 3) Delivery
export const ProductDeliverySchema = z.object({
  external_url: z.string().url('Invalid URL').max(500).nullable().optional().or(z.literal('')),
  notion_url: z.string().url('Invalid URL').max(500).nullable().optional().or(z.literal('')),
  discord_server_id: z.string().regex(/^\d*$/, 'Discord server ID must be digits only').nullable().optional(),
  discord_role_id: z.string().regex(/^\d*$/, 'Discord role ID must be digits only').nullable().optional(),
  discord_bot_token: z.string().nullable().optional(),
  telegram_invite: z.string().url('Invalid URL').max(500).nullable().optional().or(z.literal('')),
  calendly_url: z.string().url('Invalid URL').max(500).nullable().optional().or(z.literal('')),
  requires_shipping: z.boolean().optional(),
  download_limit: z.number().int().min(1).max(1000).nullable().optional(),
  access_expiry_days: z.number().int().min(1).max(3650).nullable().optional(),
})

export type ProductDeliveryInput = z.infer<typeof ProductDeliverySchema>

// 4) Funnel
export const FunnelHeadlinesSchema = z.object({
  tripwire_headline: z.string().max(255).nullable().optional(),
  bump_headline: z.string().max(255).nullable().optional(),
  bump_description: z.string().max(500).nullable().optional(),
  oto_headline: z.string().max(255).nullable().optional(),
  downsell_headline: z.string().max(255).nullable().optional(),
})

export const ProductFunnelSchema = z.object({
  tripwire_ulid: z.string().length(26).nullable().optional().or(z.literal('')),
  tripwire_price: z.number().min(0).nullable().optional(),
  bump_ulid: z.string().length(26).nullable().optional().or(z.literal('')),
  bump_price: z.number().min(0).nullable().optional(),
  oto_ulid: z.string().length(26).nullable().optional().or(z.literal('')),
  oto_price: z.number().min(0).nullable().optional(),
  oto_original_price: z.number().min(0).nullable().optional(),
  oto_timer_minutes: z.number().int().min(1).max(1440).nullable().optional(),
  downsell_ulid: z.string().length(26).nullable().optional().or(z.literal('')),
  downsell_price: z.number().min(0).nullable().optional(),
  premium_bridge_ulid: z.string().length(26).nullable().optional().or(z.literal('')),
  premium_score_threshold: z.number().min(0).nullable().optional(),
  translations: z
    .object({
      ar: FunnelHeadlinesSchema.optional(),
      en: FunnelHeadlinesSchema.optional(),
    })
    .optional(),
})

export type ProductFunnelInput = z.infer<typeof ProductFunnelSchema>

// 5) Assets
export const ProductAssetSchema = z.object({
  name: z.string().min(1, 'Asset name is required').max(200),
  asset_type: z.number().refine((v) => (AssetTypeValues as readonly number[]).includes(v), {
    message: 'Invalid asset type',
  }),
  url: z.string().url('Invalid URL').max(500).nullable().optional().or(z.literal('')),
  file_size_bytes: z.number().int().min(0).nullable().optional(),
  prompt_text: z.string().max(10000).nullable().optional(),
  prompt_category: z.string().max(100).nullable().optional(),
  sort_order: z.number().int().min(0).optional(),
})

export type ProductAssetInput = z.infer<typeof ProductAssetSchema>

// 6) FAQs
export const ProductFaqLocaleSchema = z.object({
  question: z.string().min(1, 'Question is required').max(500),
  answer: z.string().min(1, 'Answer is required').max(5000),
})

export const ProductFaqSchema = z.object({
  sort_order: z.number().int().min(0).optional(),
  translations: z.object({
    ar: ProductFaqLocaleSchema,
    en: ProductFaqLocaleSchema.partial().optional(),
  }),
})

export type ProductFaqInput = z.infer<typeof ProductFaqSchema>

// 7) Testimonials
export const ProductTestimonialLocaleSchema = z.object({
  body: z.string().min(1, 'Body is required').max(1000),
})

export const ProductTestimonialSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  role: z.string().max(100).nullable().optional(),
  avatar_url: z.string().url('Invalid avatar URL').max(500).nullable().optional().or(z.literal('')),
  rating: z.number().int().min(1).max(5).optional(),
  sort_order: z.number().int().min(0).optional(),
  translations: z.object({
    ar: ProductTestimonialLocaleSchema,
    en: ProductTestimonialLocaleSchema.optional(),
  }),
})

export type ProductTestimonialInput = z.infer<typeof ProductTestimonialSchema>

// 8) Bundle Items
export const ProductBundleItemSchema = z.object({
  item_ulid: z.string().length(26, 'Item ULID must be 26 characters'),
  sort_order: z.number().int().min(0).optional(),
})

export type ProductBundleItemInput = z.infer<typeof ProductBundleItemSchema>

// 9) CRM Tags
export const ProductCrmTagSchema = z.object({
  tag: z.string().min(1, 'Tag is required').max(100),
  action: z.string().min(1, 'Action is required').max(100),
})

export type ProductCrmTagInput = z.infer<typeof ProductCrmTagSchema>

// 10) Visibility
export const ProductVisibilitySchema = z.object({
  visible_brand_id: z.number().int().min(1).max(3),
  active: z.boolean(),
  price_override: z.number().min(0).nullable().optional(),
})

export type ProductVisibilityInput = z.infer<typeof ProductVisibilitySchema>

// ── Response Schemas ────────────────────────────────────────────────────────

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
  download_limit: z.number().nullable().optional(),
  access_expiry_days: z.number().nullable().optional(),
  delivery_method: EnumLabelSchema,
  crm_score_on_purchase: z.number().nullable().optional(),
  sort_order: z.number().optional().default(0),
  featured: z.boolean(),
  name: z.string(),
  one_liner: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  description: z.any().nullable().optional(),
  seo_meta: z.any().nullable().optional(),
  delivery_config: z.any().nullable().optional(),
  funnel_config: z.any().nullable().optional(),
  images: z
    .array(
      z.object({
        id: z.union([z.number(), z.string()]),
        url: z.string(),
        alt_text: z.string().nullable().optional(),
      }),
    )
    .optional(),
  assets: z.array(z.any()).optional(),
  testimonials: z.array(z.any()).optional(),
  faqs: z.array(z.any()).optional(),
  crm_tags: z.array(z.any()).optional(),
  brand_visibility: z.array(z.any()).optional(),
  bundle_items: z.array(z.any()).optional(),
})

export type Product = z.infer<typeof ProductSchema>
export type ProductResource = Product

export const ProductListMetaSchema = z.object({
  per_page: z.number(),
  next_cursor: z.string().nullable(),
  has_more: z.boolean(),
})

export const ProductListResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(ProductSchema),
  meta: ProductListMetaSchema.optional(),
  message: z.string().optional(),
})

export type ProductListResponse = z.infer<typeof ProductListResponseSchema>
