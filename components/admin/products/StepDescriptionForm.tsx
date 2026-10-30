'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { Globe, AlertCircle, Sparkles, Clock, Target, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ProductDescriptionSchema,
  type ProductDescriptionInput,
  type Product,
} from '@/types/dto/product.dto'
import { updateProductDescription, setFormApiErrors } from '@/lib/admin/products-client'

interface StepDescriptionFormProps {
  ulid: string
  product: Product | null
  onSuccess: () => void
  onBack?: () => void
}

export function StepDescriptionForm({
  ulid,
  product,
  onSuccess,
  onBack,
}: StepDescriptionFormProps) {
  const t = useTranslations('admin.products')
  const [activeTab, setActiveTab] = useState<'ar' | 'en'>('ar')
  const [serverError, setServerError] = useState<string | null>(null)
  const [savedSuccess, setSavedSuccess] = useState(false)

  const desc = product?.description as Record<string, any> | undefined

  const defaultValues: ProductDescriptionInput = {
    difficulty: desc?.difficulty ?? '',
    time_to_value: desc?.time_to_value ?? '',
    translations: {
      ar: {
        one_liner: desc?.translations?.ar?.one_liner ?? desc?.one_liner ?? product?.one_liner ?? '',
        target_audience: desc?.translations?.ar?.target_audience ?? '',
        pain_point: desc?.translations?.ar?.pain_point ?? '',
        outcome: desc?.translations?.ar?.outcome ?? '',
        full_description: desc?.translations?.ar?.full_description ?? desc?.body_html ?? '',
        what_you_get: desc?.translations?.ar?.what_you_get ?? '',
        refund_policy: desc?.translations?.ar?.refund_policy ?? '',
      },
      en: {
        one_liner: desc?.translations?.en?.one_liner ?? '',
        target_audience: desc?.translations?.en?.target_audience ?? '',
        pain_point: desc?.translations?.en?.pain_point ?? '',
        outcome: desc?.translations?.en?.outcome ?? '',
        full_description: desc?.translations?.en?.full_description ?? '',
        what_you_get: desc?.translations?.en?.what_you_get ?? '',
        refund_policy: desc?.translations?.en?.refund_policy ?? '',
      },
    },
  }

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProductDescriptionInput>({
    resolver: zodResolver(ProductDescriptionSchema),
    defaultValues,
  })

  const onSubmit = async (data: ProductDescriptionInput) => {
    setServerError(null)
    setSavedSuccess(false)

    const res = await updateProductDescription(ulid, data)
    if (res.ok) {
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 2000)
      onSuccess()
    } else {
      if (res.status === 422 && res.errors) {
        setFormApiErrors(res.errors, setError)
      }
      setServerError(res.message || 'Failed to save product description')
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
          <span>Description saved successfully!</span>
        </div>
      )}

      {/* Meta Highlights: Difficulty & Time to Value */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border bg-muted/20">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="difficulty" className="text-xs font-medium flex items-center gap-1.5">
            <Target className="size-3.5 text-muted-foreground" />
            Difficulty Level
          </Label>
          <Input
            id="difficulty"
            {...register('difficulty')}
            placeholder="e.g. Beginner, Intermediate, All Levels"
            maxLength={80}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="time_to_value" className="text-xs font-medium flex items-center gap-1.5">
            <Clock className="size-3.5 text-muted-foreground" />
            Time to Value / Duration
          </Label>
          <Input
            id="time_to_value"
            {...register('time_to_value')}
            placeholder="e.g. 15 minutes, 2 hours, 7 days"
            maxLength={80}
          />
        </div>
      </div>

      {/* Localized Content Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as 'ar' | 'en')}
        className="flex flex-col gap-4"
      >
        <TabsList className="w-fit">
          <TabsTrigger value="ar" className="gap-2 text-xs">
            <Globe className="size-3.5" />
            العربية (مطلوب)
          </TabsTrigger>
          <TabsTrigger value="en" className="gap-2 text-xs">
            <Globe className="size-3.5" />
            English (Optional)
          </TabsTrigger>
        </TabsList>

        {/* ── Arabic Tab ──────────────────────────────────────────────────── */}
        <TabsContent value="ar" className="flex flex-col gap-4 mt-0">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ar-target-audience" className="text-xs font-medium">
              الجمهور المستهدف (Target Audience)
            </Label>
            <Input
              id="ar-target-audience"
              dir="rtl"
              {...register('translations.ar.target_audience')}
              placeholder="لمن هذا المنتج؟ (مثال: أصحاب المتاجر والمشاريع الرقمية)"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ar-pain-point" className="text-xs font-medium">
                المشكلة التي يحلها (Pain Point)
              </Label>
              <Textarea
                id="ar-pain-point"
                dir="rtl"
                rows={3}
                {...register('translations.ar.pain_point')}
                placeholder="ما الصعوبات أو التحديات التي يعاني منها العميل؟"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ar-outcome" className="text-xs font-medium">
                النتيجة المتوقعة (Outcome)
              </Label>
              <Textarea
                id="ar-outcome"
                dir="rtl"
                rows={3}
                {...register('translations.ar.outcome')}
                placeholder="ما النتيجة الملموسة التي سيحققها المشتري؟"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ar-full-description" className="text-xs font-medium">
              الوصف الكامل والتفصيلي (Full Description)
            </Label>
            <Textarea
              id="ar-full-description"
              dir="rtl"
              rows={6}
              {...register('translations.ar.full_description')}
              placeholder="اكتب وصفًا تسويقيًا شاملاً يشرح كل جوانب المنتج..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ar-what-you-get" className="text-xs font-medium">
                ماذا ستحصل عليه بالضبط (What You Get)
              </Label>
              <Textarea
                id="ar-what-you-get"
                dir="rtl"
                rows={3}
                {...register('translations.ar.what_you_get')}
                placeholder="قائمة بالمحتويات والملفات المرفقة..."
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ar-refund-policy" className="text-xs font-medium">
                سياسة الاسترجاع الخاصة بالمنتج (Refund Policy)
              </Label>
              <Textarea
                id="ar-refund-policy"
                dir="rtl"
                rows={3}
                {...register('translations.ar.refund_policy')}
                placeholder="سياسة الاسترجاع أو الضمان الذهبي..."
              />
            </div>
          </div>
        </TabsContent>

        {/* ── English Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="en" className="flex flex-col gap-4 mt-0">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="en-target-audience" className="text-xs font-medium">
              Target Audience
            </Label>
            <Input
              id="en-target-audience"
              {...register('translations.en.target_audience')}
              placeholder="Who is this product designed for?"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="en-pain-point" className="text-xs font-medium">
                Pain Point
              </Label>
              <Textarea
                id="en-pain-point"
                rows={3}
                {...register('translations.en.pain_point')}
                placeholder="What critical problem does this solve?"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="en-outcome" className="text-xs font-medium">
                Desired Outcome
              </Label>
              <Textarea
                id="en-outcome"
                rows={3}
                {...register('translations.en.outcome')}
                placeholder="What tangible transformation does the customer get?"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="en-full-description" className="text-xs font-medium">
              Full Description
            </Label>
            <Textarea
              id="en-full-description"
              rows={6}
              {...register('translations.en.full_description')}
              placeholder="Provide a comprehensive breakdown of the offer..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="en-what-you-get" className="text-xs font-medium">
                What You Get
              </Label>
              <Textarea
                id="en-what-you-get"
                rows={3}
                {...register('translations.en.what_you_get')}
                placeholder="Itemized list of templates, playbooks, tools included..."
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="en-refund-policy" className="text-xs font-medium">
                Refund Policy
              </Label>
              <Textarea
                id="en-refund-policy"
                rows={3}
                {...register('translations.en.refund_policy')}
                placeholder="Guarantee or refund details..."
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

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
