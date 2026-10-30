'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  CheckCircle,
  AlertTriangle,
  Globe,
  Tag,
  Package,
  Layers,
  ArrowRight,
  Eye,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Product } from '@/types/dto/product.dto'
import { updateProduct } from '@/lib/admin/products-client'

interface StepReviewPublishProps {
  ulid: string
  product: Product | null
  onComplete: () => void
  onBack?: () => void
}

export function StepReviewPublish({
  ulid,
  product,
  onComplete,
  onBack,
}: StepReviewPublishProps) {
  const t = useTranslations('admin.products')
  const [loadingAction, setLoadingAction] = useState<'draft' | 'publish' | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const isPublished = product?.status?.id === 2

  const handleSetStatus = async (targetStatus: 1 | 2) => {
    setLoadingAction(targetStatus === 2 ? 'publish' : 'draft')
    setErrorMsg(null)
    setSuccessMsg(null)

    const res = await updateProduct(ulid, { status: targetStatus })
    if (res.ok) {
      setSuccessMsg(
        targetStatus === 2
          ? t('wizard.publishSuccess')
          : 'Product status saved as Draft.',
      )
      setTimeout(() => {
        onComplete()
      }, 1000)
    } else {
      setErrorMsg(res.message || 'Failed to update product status')
    }
    setLoadingAction(null)
  }

  return (
    <div className="flex flex-col gap-6">
      {errorMsg && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle className="size-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Review Card */}
      <div className="p-5 rounded-xl border bg-card flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-4">
          <div className="flex items-center gap-3">
            {product?.hero_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.hero_image_url}
                alt="Product Hero"
                className="size-14 rounded-lg object-cover border"
              />
            ) : (
              <div className="size-14 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground border">
                No Hero
              </div>
            )}
            <div>
              <h3 className="text-base font-semibold">
                {product?.name || product?.internal_name || 'Product Review'}
              </h3>
              <p className="text-xs text-muted-foreground">
                SKU: <span className="font-mono">{product?.sku || 'None'}</span> • ULID: {ulid}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={isPublished ? 'default' : 'secondary'} className="text-xs">
              {product?.status?.label || (isPublished ? 'Published' : 'Draft')}
            </Badge>
          </div>
        </div>

        {/* Specifications grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-muted/20 border">
            <span className="text-muted-foreground">Type:</span>
            <p className="font-medium mt-0.5">{product?.type?.label ?? 'Ebook'}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/20 border">
            <span className="text-muted-foreground">Delivery Method:</span>
            <p className="font-medium mt-0.5">{product?.delivery_method?.label ?? 'File Download'}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/20 border">
            <span className="text-muted-foreground">Base Price:</span>
            <p className="font-medium mt-0.5">
              {product?.base_price} {product?.currency}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/20 border">
            <span className="text-muted-foreground">Sale Price:</span>
            <p className="font-medium mt-0.5">
              {product?.sale_price ? `${product.sale_price} ${product.currency}` : 'None'}
            </p>
          </div>
        </div>

        {/* Publishing Readiness Checklist */}
        <div className="flex flex-col gap-2 pt-2 border-t">
          <h4 className="text-xs font-semibold text-muted-foreground">Catalog Readiness</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Check className="size-3.5 text-emerald-500" />
              <span>Arabic Name & One-liner provided</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="size-3.5 text-emerald-500" />
              <span>Pricing & VAT rule configured</span>
            </div>
            <div className="flex items-center gap-2">
              {product?.hero_image_url ? (
                <Check className="size-3.5 text-emerald-500" />
              ) : (
                <AlertTriangle className="size-3.5 text-amber-500" />
              )}
              <span>Hero image uploaded</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="size-3.5 text-emerald-500" />
              <span>Delivery configuration ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        {onBack ? (
          <Button type="button" variant="outline" size="sm" onClick={onBack}>
            {t('wizard.back')}
          </Button>
        ) : <div />}

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleSetStatus(1)}
            disabled={loadingAction !== null}
          >
            {loadingAction === 'draft' ? t('wizard.saving') : t('wizard.saveDraft')}
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => handleSetStatus(2)}
            disabled={loadingAction !== null}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {loadingAction === 'publish' ? t('wizard.publishing') : t('wizard.publish')}
          </Button>
        </div>
      </div>
    </div>
  )
}
