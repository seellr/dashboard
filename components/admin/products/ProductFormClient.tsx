'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { sileo } from 'sileo'
import { ChevronDown, ChevronRight, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { makeCreateProductSchema, makeUpdateProductSchema } from '@/types/dto/product-form.dto'
import type { ProductFormValues, ProductUpdateFormValues } from '@/types/dto/product-form.dto'
import { ProductTypeValues, ProductTypeLabels } from '@/types/dto/product.dto'
import { useCreateProduct, useUpdateProduct } from '@/hooks/queries/useProducts'
import type { Product } from '@/types/dto/product.dto'
import { MediaPicker } from '@/components/admin/media/MediaPicker'

const DEFAULT_DELIVERY_METHOD = 1
const DEFAULT_VAT_RULE = 1

const DELIVERY_METHOD_LABELS: Record<number, string> = {
  1: 'Digital Download', 2: 'Streaming', 3: 'External Link',
  4: 'Course Access', 5: 'Discord Invite', 6: 'Telegram Invite',
  7: 'Email Delivery', 8: 'Physical', 9: 'No Delivery',
}

const VAT_RULE_LABELS: Record<number, string> = {
  1: 'Standard (14%)', 2: 'Zero Rated', 3: 'Exempt',
}

const STATUS_LABELS: Record<string, string> = {
  '1': 'Draft', '2': 'Published', '3': 'Archived',
  '4': 'Coming Soon', '5': 'Waitlist',
}

export function ProductFormClient({
  locale,
  existing,
  onSuccess,
}: {
  locale: string
  existing: Product | null
  onSuccess?: () => void
}) {
  const t = useTranslations('admin')
  const router = useRouter()
  const isNew = existing === null
  const [showTranslations, setShowTranslations] = useState(false)

  const schema = isNew ? makeCreateProductSchema(t) : makeUpdateProductSchema(t)
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct(existing?.ulid ?? '')

  const form = useForm<ProductFormValues | ProductUpdateFormValues>({
    resolver: zodResolver(schema),
    defaultValues: existing
      ? {
        internal_name: existing.internal_name,
        type: existing.type.id,
        delivery_method: existing.delivery_method.id,
        base_price: Number(existing.base_price),
        sale_price: existing.sale_price ? Number(existing.sale_price) : undefined,
        currency: existing.currency,
        vat_rule: existing.vat_rule.id,
        sku: existing.sku ?? '',
        coupon_eligible: existing.coupon_eligible,
        featured: existing.featured,
        status: existing.status?.id,
        crm_score_on_purchase: 0,
        sort_order: 0,
        hero_image_url: (existing as Record<string, unknown>).hero_image_url as string ?? null,
        translations: {
          ar: { name: existing.name, one_liner: existing.one_liner ?? '' },
          en: { name: '', one_liner: '' },
        },
      }
      : {
        internal_name: '',
        type: ProductTypeValues[0],
        delivery_method: DEFAULT_DELIVERY_METHOD,
        base_price: 0,
        currency: 'EGP',
        vat_rule: DEFAULT_VAT_RULE,
        sku: '',
        coupon_eligible: false,
        featured: false,
        crm_score_on_purchase: 0,
        sort_order: 0,
        hero_image_url: null,
        translations: { ar: { name: '', one_liner: '' }, en: { name: '', one_liner: '' } },
      },
  })

  async function onSubmit(values: ProductFormValues | ProductUpdateFormValues) {
    const payload = { ...values, sku: values.sku?.trim() || null }
    const mutation = isNew ? createProduct : updateProduct
    const result = await mutation.mutateAsync(payload as never)
    if (!result.ok) {
      sileo.error({ title: t('products.form.saveError'), description: result.message })
      return
    }
    sileo.success({ title: t('products.form.saveSuccess') })
    if (onSuccess) {
      onSuccess()
    } else {
      router.push(`/${locale}/products`)
      router.refresh()
    }
  }

  const isPending = createProduct.isPending || updateProduct.isPending
  const errors = form.formState.errors as Record<string, { message?: string }>
  const translationErrors = form.formState.errors.translations as { ar?: { name?: { message?: string } } } | undefined

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5 max-w-2xl">

      {/* Hero image */}
      <div className="flex flex-col gap-1.5 w-full">
        <label className="text-sm font-medium">Hero image</label>
        <MediaPicker
          value={form.watch('hero_image_url') ?? null}
          onChange={(url) => form.setValue('hero_image_url', url)}
          onClear={() => form.setValue('hero_image_url', null)}
          label="Choose hero image"
        />
      </div>

      {/* Internal name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">{t('products.form.internalName')}</label>
        <Input {...form.register('internal_name')} placeholder="For internal reference only" />
        {errors.internal_name && <p className="text-sm text-destructive">{String(errors.internal_name.message)}</p>}
      </div>

      {/* Primary language (AR) - single field, no tabs */}
      <div className="rounded-lg border p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2 mb-1">
          <Globe className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Product name & description</span>
          <span className="text-xs text-muted-foreground ms-1">(Arabic — primary)</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">{t('products.form.nameAr')}</label>
          <Input {...form.register('translations.ar.name')} dir="rtl" placeholder="اسم المنتج" />
          {translationErrors?.ar?.name && (
            <p className="text-sm text-destructive">{String(translationErrors.ar.name.message)}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">{t('products.form.oneLinerAr')}</label>
          <Input {...form.register('translations.ar.one_liner')} dir="rtl" placeholder="وصف قصير" />
        </div>
      </div>

      {/* Optional EN translations — collapsible */}
      <div className="rounded-lg border">
        <button
          type="button"
          onClick={() => setShowTranslations((v) => !v)}
          className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {showTranslations ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          <Globe className="size-4" />
          English translation
          <span className="ms-auto text-xs text-muted-foreground/60">optional</span>
        </button>
        {showTranslations && (
          <div className="border-t px-4 pb-4 pt-3 flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">{t('products.form.nameEn')}</label>
              <Input {...form.register('translations.en.name')} dir="ltr" placeholder="Product name in English" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">{t('products.form.oneLinerEn')}</label>
              <Input {...form.register('translations.en.one_liner')} dir="ltr" placeholder="Short description in English" />
            </div>
          </div>
        )}
      </div>

      {/* Type + Delivery method */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">{t('products.form.type')}</label>
          <Select
            value={String(form.watch('type'))}
            onValueChange={(v) => form.setValue('type', Number(v), { shouldValidate: true })}
          >
            <SelectTrigger className="w-full">
              <SelectValue>{(v: string | null) => v ? (ProductTypeLabels[Number(v)] ?? v) : 'Select type'}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {ProductTypeValues.map((value) => (
                <SelectItem key={value} value={String(value)}>{ProductTypeLabels[value]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">{t('products.form.deliveryMethod') ?? 'Delivery Method'}</label>
          <Select
            value={String(form.watch('delivery_method'))}
            onValueChange={(v) => form.setValue('delivery_method', Number(v))}
          >
            <SelectTrigger className="w-full">
              <SelectValue>{(v: string | null) => v ? (DELIVERY_METHOD_LABELS[Number(v)] ?? v) : 'Select method'}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(DELIVERY_METHOD_LABELS).map(([val, label]) => (
                <SelectItem key={val} value={val}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* VAT + SKU */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">{t('products.form.vatRule') ?? 'VAT Rule'}</label>
          <Select
            value={String(form.watch('vat_rule'))}
            onValueChange={(v) => form.setValue('vat_rule', Number(v))}
          >
            <SelectTrigger className="w-full">
              <SelectValue>{(v: string | null) => v ? (VAT_RULE_LABELS[Number(v)] ?? v) : 'Select VAT'}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(VAT_RULE_LABELS).map(([val, label]) => (
                <SelectItem key={val} value={val}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">{t('products.form.sku')}</label>
          <Input {...form.register('sku')} placeholder="PROD-001" />
          {errors.sku && <p className="text-sm text-destructive">{String(errors.sku.message)}</p>}
        </div>
      </div>

      {/* Price row */}
      <div className="flex gap-4">
        <div className="flex flex-col gap-1.5 flex-1">
          <label className="text-sm font-medium">{t('products.form.basePrice')}</label>
          <Input type="number" step="0.01" min={0} {...form.register('base_price', { valueAsNumber: true })} />
          {errors.base_price && <p className="text-sm text-destructive">{String(errors.base_price.message)}</p>}
        </div>
        <div className="flex flex-col gap-1.5 flex-1">
          <label className="text-sm font-medium">{t('products.form.salePrice')}</label>
          <Input type="number" step="0.01" min={0} {...form.register('sale_price', { setValueAs: (v) => v === '' || v === null || v === undefined || isNaN(Number(v)) ? undefined : Number(v) })} />
        </div>
        <div className="flex flex-col gap-1.5 w-24">
          <label className="text-sm font-medium">{t('products.form.currency')}</label>
          <Input {...form.register('currency')} disabled maxLength={3} />
        </div>
      </div>

      {/* Extra fields */}
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">{t('products.form.downloadLimit')}</label>
          <Input type="number" min={1} {...form.register('download_limit', { setValueAs: (v) => v === '' || v === null || v === undefined || isNaN(Number(v)) ? undefined : Number(v) })} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">{t('products.form.accessExpiryDays')}</label>
          <Input type="number" min={1} {...form.register('access_expiry_days', { setValueAs: (v) => v === '' || v === null || v === undefined || isNaN(Number(v)) ? undefined : Number(v) })} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">{t('products.form.crmScore')}</label>
          <Input type="number" min={0} {...form.register('crm_score_on_purchase', { valueAsNumber: true, setValueAs: (v) => v === '' || isNaN(v) ? 0 : Number(v) })} />
        </div>
      </div>

      {/* Sort order + status */}
      <div className="flex gap-4">
        <div className="flex flex-col gap-1.5 flex-1">
          <label className="text-sm font-medium">{t('products.form.sortOrder')}</label>
          <Input type="number" min={0} {...form.register('sort_order', { valueAsNumber: true, setValueAs: (v) => v === '' || isNaN(v) ? 0 : Number(v) })} />
        </div>
        {!isNew && (
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-sm font-medium">{t('products.form.status')}</label>
            <Select
              value={String(form.watch('status') ?? '')}
              onValueChange={(v) => form.setValue('status', Number(v))}
            >
              <SelectTrigger className="w-full">
                <SelectValue>{(v: string | null) => v ? (STATUS_LABELS[v] ?? v) : 'Select status'}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABELS).map(([val, label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Toggles */}
      <div className="flex gap-6 items-center py-1">
        <div className="flex items-center gap-2">
          <Switch checked={form.watch('coupon_eligible')} onCheckedChange={(v) => form.setValue('coupon_eligible', v)} />
          <label className="text-sm font-medium">{t('products.form.couponEligible')}</label>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={form.watch('featured')} onCheckedChange={(v) => form.setValue('featured', v)} />
          <label className="text-sm font-medium">{t('products.form.featured')}</label>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending ? 'Saving…' : t('products.form.save')}
        </Button>
      </div>
    </form>
  )
}
