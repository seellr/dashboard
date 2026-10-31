'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { ProductImagesManager } from './ProductImagesManager'
import type { Product } from '@/types/dto/product.dto'

interface StepImagesFormProps {
  ulid: string
  product: Product | null
  onSuccess: () => void
  onBack?: () => void
}

export function StepImagesForm({
  ulid,
  product,
  onSuccess,
  onBack,
}: StepImagesFormProps) {
  const t = useTranslations('admin.products')

  const galleryItems = product?.images?.map((img) => ({
    id: img.id,
    url: img.url,
    alt_text: img.alt_text ?? null,
  })) ?? []

  return (
    <div className="flex flex-col gap-6">
      <ProductImagesManager
        productUlid={ulid}
        heroImageUrl={product?.hero_image_url ?? null}
        galleryImages={galleryItems}
      />

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        {onBack ? (
          <Button type="button" variant="outline" size="sm" onClick={onBack}>
            {t('wizard.back')}
          </Button>
        ) : <div />}

        <Button type="button" size="sm" onClick={onSuccess}>
          {t('wizard.saveAndContinue')}
        </Button>
      </div>
    </div>
  )
}
