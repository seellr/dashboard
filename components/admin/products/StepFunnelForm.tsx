'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import {
  GitFork,
  Zap,
  ShoppingBag,
  ArrowDownRight,
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  ProductFunnelSchema,
  type ProductFunnelInput,
  type Product,
} from '@/types/dto/product.dto'
import { updateProductFunnel, setFormApiErrors } from '@/lib/admin/products-client'

interface StepFunnelFormProps {
  ulid: string
  product: Product | null
  onSuccess: () => void
  onBack?: () => void
}

export function StepFunnelForm({
  ulid,
  product,
  onSuccess,
  onBack,
}: StepFunnelFormProps) {
  const t = useTranslations('admin.products')
  const [serverError, setServerError] = useState<string | null>(null)
  const [savedSuccess, setSavedSuccess] = useState(false)

  const funnel = product?.funnel_config as Record<string, any> | undefined

  const defaultValues: ProductFunnelInput = {
    tripwire_ulid: funnel?.tripwire_ulid ?? '',
    tripwire_price: funnel?.tripwire_price ? Number(funnel.tripwire_price) : undefined,
    bump_ulid: funnel?.bump_ulid ?? '',
    bump_price: funnel?.bump_price ? Number(funnel.bump_price) : undefined,
    oto_ulid: funnel?.oto_ulid ?? '',
    oto_price: funnel?.oto_price ? Number(funnel.oto_price) : undefined,
    oto_original_price: funnel?.oto_original_price ? Number(funnel.oto_original_price) : undefined,
    oto_timer_minutes: funnel?.oto_timer_minutes ? Number(funnel.oto_timer_minutes) : undefined,
    downsell_ulid: funnel?.downsell_ulid ?? '',
    downsell_price: funnel?.downsell_price ? Number(funnel.downsell_price) : undefined,
    premium_bridge_ulid: funnel?.premium_bridge_ulid ?? '',
    premium_score_threshold: funnel?.premium_score_threshold ? Number(funnel.premium_score_threshold) : undefined,
    translations: {
      ar: {
        tripwire_headline: funnel?.translations?.ar?.tripwire_headline ?? '',
        bump_headline: funnel?.translations?.ar?.bump_headline ?? '',
        bump_description: funnel?.translations?.ar?.bump_description ?? '',
        oto_headline: funnel?.translations?.ar?.oto_headline ?? '',
        downsell_headline: funnel?.translations?.ar?.downsell_headline ?? '',
      },
      en: {
        tripwire_headline: funnel?.translations?.en?.tripwire_headline ?? '',
        bump_headline: funnel?.translations?.en?.bump_headline ?? '',
        bump_description: funnel?.translations?.en?.bump_description ?? '',
        oto_headline: funnel?.translations?.en?.oto_headline ?? '',
        downsell_headline: funnel?.translations?.en?.downsell_headline ?? '',
      },
    },
  }

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProductFunnelInput>({
    resolver: zodResolver(ProductFunnelSchema),
    defaultValues,
  })

  const onSubmit = async (data: ProductFunnelInput) => {
    setServerError(null)
    setSavedSuccess(false)

    const payload = {
      tripwire_ulid: data.tripwire_ulid?.trim() || null,
      tripwire_price: data.tripwire_price ? Number(data.tripwire_price) : null,
      bump_ulid: data.bump_ulid?.trim() || null,
      bump_price: data.bump_price ? Number(data.bump_price) : null,
      oto_ulid: data.oto_ulid?.trim() || null,
      oto_price: data.oto_price ? Number(data.oto_price) : null,
      oto_original_price: data.oto_original_price ? Number(data.oto_original_price) : null,
      oto_timer_minutes: data.oto_timer_minutes ? Number(data.oto_timer_minutes) : null,
      downsell_ulid: data.downsell_ulid?.trim() || null,
      downsell_price: data.downsell_price ? Number(data.downsell_price) : null,
      premium_bridge_ulid: data.premium_bridge_ulid?.trim() || null,
      premium_score_threshold: data.premium_score_threshold ? Number(data.premium_score_threshold) : null,
      translations: data.translations,
    }

    const res = await updateProductFunnel(ulid, payload)
    if (res.ok) {
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 2000)
      onSuccess()
    } else {
      if (res.status === 422 && res.errors) {
        setFormApiErrors(res.errors, setError)
      }
      setServerError(res.message || 'Failed to save funnel config')
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

      {savedSuccess && (
        <div className="flex items-center gap-2 p-3 text-xs rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>Funnel configuration saved successfully!</span>
        </div>
      )}

      <div className="p-4 rounded-xl border bg-muted/20">
        <p className="text-xs text-muted-foreground">
          Configuring funnel offers (Order Bump, One-Time Offer, Downsell) is completely optional.
          Leave ULIDs empty if not applicable.
        </p>
      </div>

      {/* 1: Order Bump Offer */}
      <div className="p-5 rounded-xl border bg-card flex flex-col gap-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Zap className="size-4 text-amber-500" />
          Order Bump Offer (At Checkout)
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium">Bump Product ULID</Label>
            <Input {...register('bump_ulid')} placeholder="26-char product ULID" maxLength={26} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium">Bump Special Price</Label>
            <Input type="number" step="0.01" {...register('bump_price', { valueAsNumber: true })} placeholder="0.00" />
          </div>
          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <Label className="text-xs font-medium">Bump Headline (Arabic)</Label>
            <Input dir="rtl" {...register('translations.ar.bump_headline')} placeholder="نعم! أضف هذا العرض المميز بخصم خاص..." />
          </div>
          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <Label className="text-xs font-medium">Bump Description (Arabic)</Label>
            <Textarea dir="rtl" rows={2} {...register('translations.ar.bump_description')} placeholder="شرح مختصر ومغري للعرض..." />
          </div>
        </div>
      </div>

      {/* 2: One-Time Offer (OTO / Upsell) */}
      <div className="p-5 rounded-xl border bg-card flex flex-col gap-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <ShoppingBag className="size-4 text-indigo-500" />
          One-Time Offer (OTO Upsell After Purchase)
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <Label className="text-xs font-medium">OTO Product ULID</Label>
            <Input {...register('oto_ulid')} placeholder="26-char product ULID" maxLength={26} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium">Countdown Timer (Minutes)</Label>
            <Input type="number" min="1" max="1440" {...register('oto_timer_minutes', { valueAsNumber: true })} placeholder="15" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium">OTO Special Price</Label>
            <Input type="number" step="0.01" {...register('oto_price', { valueAsNumber: true })} placeholder="0.00" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium">Original Strikethrough Price</Label>
            <Input type="number" step="0.01" {...register('oto_original_price', { valueAsNumber: true })} placeholder="0.00" />
          </div>
          <div className="sm:col-span-3 flex flex-col gap-1.5">
            <Label className="text-xs font-medium">OTO Headline (Arabic)</Label>
            <Input dir="rtl" {...register('translations.ar.oto_headline')} placeholder="انتظر لحظة! عرض حصري لمرة واحدة فقط..." />
          </div>
        </div>
      </div>

      {/* 3: Downsell Offer */}
      <div className="p-5 rounded-xl border bg-card flex flex-col gap-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <ArrowDownRight className="size-4 text-rose-500" />
          Downsell Offer (If OTO is Declined)
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium">Downsell Product ULID</Label>
            <Input {...register('downsell_ulid')} placeholder="26-char product ULID" maxLength={26} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium">Downsell Price</Label>
            <Input type="number" step="0.01" {...register('downsell_price', { valueAsNumber: true })} placeholder="0.00" />
          </div>
          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <Label className="text-xs font-medium">Downsell Headline (Arabic)</Label>
            <Input dir="rtl" {...register('translations.ar.downsell_headline')} placeholder="هل السعر السابق لا يناسبك؟ خذ هذه الخطة الأساسية..." />
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        {onBack ? (
          <Button type="button" variant="outline" size="sm" onClick={onBack}>
            {t('wizard.back')}
          </Button>
        ) : <div />}

        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? t('wizard.saving') : t('wizard.saveAndContinue')}
        </Button>
      </div>
    </form>
  )
}
