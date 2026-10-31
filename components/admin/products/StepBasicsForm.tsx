'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { Globe, DollarSign, Settings2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CreateProductSchema,
  DeliveryMethodLabels,
  DeliveryMethodValues,
  ProductTypeLabels,
  ProductTypeValues,
  VatRuleLabels,
  VatRuleValues,
  type CreateProductInput,
  type Product,
} from '@/types/dto/product.dto'
import { createProduct, updateProduct, setFormApiErrors } from '@/lib/admin/products-client'

interface StepBasicsFormProps {
  product: Product | null
  onSuccess: (ulid: string, updatedProduct?: Product) => void
  onCancel?: () => void
}

export function StepBasicsForm({ product, onSuccess, onCancel }: StepBasicsFormProps) {
  const t = useTranslations('admin.products')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const defaultValues: CreateProductInput = {
    internal_name: product?.internal_name ?? '',
    type: product?.type?.id ?? 1,
    delivery_method: product?.delivery_method?.id ?? 1,
    base_price: product ? Number(product.base_price) : 0,
    sale_price: product?.sale_price !== null && product?.sale_price !== undefined ? Number(product.sale_price) : null,
    currency: product?.currency ?? 'EGP',
    vat_rule: product?.vat_rule?.id ?? 1,
    sku: product?.sku ?? '',
    translations: {
      ar: {
        name: product?.name ?? '',
        one_liner: product?.one_liner ?? '',
      },
      en: {
        name: '',
        one_liner: '',
      },
    },
    download_limit: product?.download_limit ?? null,
    access_expiry_days: product?.access_expiry_days ?? null,
    coupon_eligible: product?.coupon_eligible ?? true,
    crm_score_on_purchase: product?.crm_score_on_purchase ?? null,
    sort_order: product?.sort_order ?? 0,
    featured: product?.featured ?? false,
  }

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CreateProductInput>({
    resolver: zodResolver(CreateProductSchema),
    defaultValues,
  })

  const currentType = watch('type')
  const currentDelivery = watch('delivery_method')
  const currentVat = watch('vat_rule')
  const couponEligible = watch('coupon_eligible')
  const featured = watch('featured')

  const onSubmit = async (data: CreateProductInput) => {
    setServerError(null)

    // Ensure numeric transformations
    const payload: CreateProductInput = {
      ...data,
      base_price: Number(data.base_price),
      sale_price: data.sale_price !== null && data.sale_price !== undefined && data.sale_price > 0 ? Number(data.sale_price) : null,
      download_limit: data.download_limit ? Number(data.download_limit) : null,
      access_expiry_days: data.access_expiry_days ? Number(data.access_expiry_days) : null,
      crm_score_on_purchase: data.crm_score_on_purchase ? Number(data.crm_score_on_purchase) : null,
      sort_order: data.sort_order ? Number(data.sort_order) : 0,
      sku: data.sku?.trim() || undefined,
    }

    if (!product) {
      // Create product
      const res = await createProduct(payload)
      if (res.ok && res.data) {
        onSuccess(res.data.ulid, res.data)
      } else {
        if (res.status === 422 && res.errors) {
          setFormApiErrors(res.errors, setError)
        }
        if (res.errorCode === 'product_sku_taken') {
          setError('sku', { type: 'server', message: t('validation.skuTaken') })
        }
        setServerError(res.message || 'Failed to create product')
      }
    } else {
      // Update basic fields
      const res = await updateProduct(product.ulid, payload)
      if (res.ok && res.data) {
        onSuccess(product.ulid, res.data)
      } else {
        if (res.status === 422 && res.errors) {
          setFormApiErrors(res.errors, setError)
        }
        if (res.errorCode === 'product_sku_taken') {
          setError('sku', { type: 'server', message: t('validation.skuTaken') })
        }
        setServerError(res.message || 'Failed to update product')
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {serverError && (
        <div className="flex items-center gap-2 p-3 text-xs rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Internal name & SKU */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 flex flex-col gap-1.5">
          <Label htmlFor="internal_name" className="text-xs font-medium">
            {t('form.internalName')} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="internal_name"
            {...register('internal_name')}
            placeholder="e.g. 2026 E-Book Mastery Pack"
            className={errors.internal_name ? 'border-destructive' : ''}
          />
          {errors.internal_name && (
            <p className="text-xs text-destructive">{errors.internal_name.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sku" className="text-xs font-medium">
            {t('form.sku')} (Optional)
          </Label>
          <Input
            id="sku"
            {...register('sku')}
            placeholder="EBK-2026-001"
            className={errors.sku ? 'border-destructive' : ''}
          />
          {errors.sku && <p className="text-xs text-destructive">{errors.sku.message}</p>}
        </div>
      </div>

      {/* Type & Delivery Method */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium">
            {t('form.type')} <span className="text-destructive">*</span>
          </Label>
          <Select
            value={String(currentType)}
            onValueChange={(val) => setValue('type', Number(val), { shouldValidate: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {ProductTypeValues.map((val) => (
                <SelectItem key={val} value={String(val)}>
                  {ProductTypeLabels[val]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium">
            {t('form.deliveryMethod')} <span className="text-destructive">*</span>
          </Label>
          <Select
            value={String(currentDelivery)}
            onValueChange={(val) => setValue('delivery_method', Number(val), { shouldValidate: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select delivery method" />
            </SelectTrigger>
            <SelectContent>
              {DeliveryMethodValues.map((val) => (
                <SelectItem key={val} value={String(val)}>
                  {DeliveryMethodLabels[val]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.delivery_method && (
            <p className="text-xs text-destructive">{errors.delivery_method.message}</p>
          )}
        </div>
      </div>

      {/* Pricing & VAT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl border bg-muted/20">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="base_price" className="text-xs font-medium">
            {t('form.basePrice')} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="base_price"
            type="number"
            step="0.01"
            min="0"
            max="999999.99"
            {...register('base_price', { valueAsNumber: true })}
            placeholder="0.00"
            className={errors.base_price ? 'border-destructive' : ''}
          />
          {errors.base_price && (
            <p className="text-xs text-destructive">{errors.base_price.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sale_price" className="text-xs font-medium">
            {t('form.salePrice')} (Optional)
          </Label>
          <Input
            id="sale_price"
            type="number"
            step="0.01"
            min="0"
            max="999999.99"
            {...register('sale_price', { valueAsNumber: true })}
            placeholder="0.00"
            className={errors.sale_price ? 'border-destructive' : ''}
          />
          {errors.sale_price && (
            <p className="text-xs text-destructive">{errors.sale_price.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="currency" className="text-xs font-medium">
            {t('form.currency')} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="currency"
            {...register('currency')}
            placeholder="EGP"
            maxLength={3}
            className={`uppercase ${errors.currency ? 'border-destructive' : ''}`}
            onChange={(e) => setValue('currency', e.target.value.toUpperCase())}
          />
          {errors.currency && (
            <p className="text-xs text-destructive">{errors.currency.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium">
            {t('form.vatRule')} <span className="text-destructive">*</span>
          </Label>
          <Select
            value={String(currentVat)}
            onValueChange={(val) => setValue('vat_rule', Number(val), { shouldValidate: true })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VatRuleValues.map((val) => (
                <SelectItem key={val} value={String(val)}>
                  {VatRuleLabels[val]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.vat_rule && (
            <p className="text-xs text-destructive">{errors.vat_rule.message}</p>
          )}
        </div>
      </div>

      {/* Translations (AR & EN) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Arabic (Required) */}
        <div className="rounded-xl border p-4 flex flex-col gap-3 bg-card">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
            <Globe className="size-4" />
            <span>العربية (مطلوب)</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ar-name" className="text-xs font-medium">
              اسم المنتج <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ar-name"
              dir="rtl"
              {...register('translations.ar.name')}
              placeholder="مثال: دليل ريادة الأعمال الشامل"
              className={errors.translations?.ar?.name ? 'border-destructive' : ''}
            />
            {errors.translations?.ar?.name && (
              <p className="text-xs text-destructive">{errors.translations.ar.name.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ar-one-liner" className="text-xs font-medium">
              وصف مختصر (One-liner)
            </Label>
            <Input
              id="ar-one-liner"
              dir="rtl"
              {...register('translations.ar.one_liner')}
              placeholder="عبارة تسويقية واحدة تلخص قيمة المنتج"
            />
          </div>
        </div>

        {/* English (Optional) */}
        <div className="rounded-xl border p-4 flex flex-col gap-3 bg-card">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Globe className="size-4" />
            <span>English (Optional)</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="en-name" className="text-xs font-medium">
              Product Name
            </Label>
            <Input
              id="en-name"
              {...register('translations.en.name')}
              placeholder="e.g. Complete Entrepreneurship Playbook"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="en-one-liner" className="text-xs font-medium">
              One-liner Summary
            </Label>
            <Input
              id="en-one-liner"
              {...register('translations.en.one_liner')}
              placeholder="A single compelling sentence describing the offer"
            />
          </div>
        </div>
      </div>

      {/* Advanced Collapsible Section */}
      <div className="rounded-xl border overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAdvanced((prev) => !prev)}
          className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors text-start"
        >
          <div className="flex items-center gap-2">
            <Settings2 className="size-4 text-muted-foreground" />
            <span className="text-xs font-semibold">Advanced Catalog Options</span>
          </div>
          {showAdvanced ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>

        {showAdvanced && (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 border-t bg-card">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="download_limit" className="text-xs font-medium">
                {t('form.downloadLimit')}
              </Label>
              <Input
                id="download_limit"
                type="number"
                min="1"
                max="1000"
                {...register('download_limit', { valueAsNumber: true })}
                placeholder="Unlimited (empty)"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="access_expiry_days" className="text-xs font-medium">
                {t('form.accessExpiryDays')}
              </Label>
              <Input
                id="access_expiry_days"
                type="number"
                min="1"
                max="3650"
                {...register('access_expiry_days', { valueAsNumber: true })}
                placeholder="Lifetime (empty)"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="crm_score" className="text-xs font-medium">
                {t('form.crmScore')}
              </Label>
              <Input
                id="crm_score"
                type="number"
                min="0"
                max="10000"
                {...register('crm_score_on_purchase', { valueAsNumber: true })}
                placeholder="e.g. 50"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sort_order" className="text-xs font-medium">
                {t('form.sortOrder')}
              </Label>
              <Input
                id="sort_order"
                type="number"
                min="0"
                {...register('sort_order', { valueAsNumber: true })}
                placeholder="0"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
              <Label htmlFor="coupon_eligible" className="text-xs font-medium cursor-pointer">
                {t('form.couponEligible')}
              </Label>
              <Switch
                id="coupon_eligible"
                checked={couponEligible ?? true}
                onCheckedChange={(val) => setValue('coupon_eligible', val)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
              <Label htmlFor="featured" className="text-xs font-medium cursor-pointer">
                {t('form.featured')}
              </Label>
              <Switch
                id="featured"
                checked={featured ?? false}
                onCheckedChange={(val) => setValue('featured', val)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Form Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        {onCancel ? (
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            {t('form.deleteCancel')}
          </Button>
        ) : <div />}

        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting
            ? t('wizard.saving')
            : product
              ? t('wizard.saveChanges')
              : t('wizard.saveAndContinue')}
        </Button>
      </div>
    </form>
  )
}
