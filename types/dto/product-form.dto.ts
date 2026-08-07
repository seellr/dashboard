import { z } from 'zod'
import type { useTranslations } from 'next-intl'
import { ProductTypeValues } from '@/types/dto/product.dto'

type T = ReturnType<typeof useTranslations<'admin'>>

export function makeCreateProductSchema(t: T) {
  return z.object({
    brand_id: z.number().int().min(1).nullable().optional(),
    internal_name: z.string().min(1, t('products.validation.nameRequired')).max(200, t('products.validation.nameTooLong')),
    type: z.number().refine((v) => (ProductTypeValues as readonly number[]).includes(v), t('products.validation.typeInvalid')),
    delivery_method: z.number().int(),
    base_price: z.number().min(0, t('products.validation.priceInvalid')).max(999999.99),
    sale_price: z.number().min(0).optional(),
    download_limit: z.number().int().min(1).max(1000).optional(),
    access_expiry_days: z.number().int().min(1).max(3650).optional(),
    currency: z.string().length(3, t('products.validation.currencyInvalid')),
    vat_rule: z.number().int(),
    sku: z.string().max(80).regex(/^[A-Za-z0-9\-_]*$/, t('products.validation.skuInvalid')).nullable().optional(),
    coupon_eligible: z.boolean(),
    featured: z.boolean(),
    crm_score_on_purchase: z.number().int().min(0).max(10000).optional(),
    sort_order: z.number().int().min(0).optional(),
    hero_image_url: z.string().url().nullable().optional(),
    translations: z.object({
      ar: z.object({
        name: z.string().min(1, t('products.validation.nameRequired')).max(200, t('products.validation.nameTooLong')),
        one_liner: z.string().max(300).nullable().optional(),
      }),
      en: z.object({
        name: z.string().max(200).optional(),
        one_liner: z.string().max(300).nullable().optional(),
      }).optional(),
    }),
  })
}

export function makeUpdateProductSchema(t: T) {
  return makeCreateProductSchema(t).omit({ brand_id: true }).extend({
    status: z.number().int().optional(),
  })
}

export type ProductFormValues = z.infer<ReturnType<typeof makeCreateProductSchema>>
export type ProductUpdateFormValues = z.infer<ReturnType<typeof makeUpdateProductSchema>>
