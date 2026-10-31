'use client'

import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import {
  Upload,
  Trash2,
  Image as ImageIcon,
  AlertCircle,
  RotateCw,
  Plus,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  MAX_PRODUCT_IMAGE_SIZE,
  isAllowedProductImage,
} from '@/types/dto/media.dto'
import {
  useDeleteGalleryImage,
  useUploadGalleryImage,
  useUploadHeroImage,
} from '@/hooks/queries/useMedia'

export interface ProductGalleryItem {
  id: number | string
  url: string
  alt_text?: string | null
}

interface ProductImagesManagerProps {
  productUlid: string
  heroImageUrl?: string | null
  galleryImages?: ProductGalleryItem[]
  onHeroImageUpdated?: (newUrl: string) => void
  onGalleryUpdated?: () => void
}

export function ProductImagesManager({
  productUlid,
  heroImageUrl,
  galleryImages = [],
  onHeroImageUpdated,
  onGalleryUpdated,
}: ProductImagesManagerProps) {
  const t = useTranslations('admin.media')

  // Hero Image State
  const [heroPreview, setHeroPreview] = useState<string | null>(heroImageUrl ?? null)
  const [heroProgress, setHeroProgress] = useState(0)
  const [heroError, setHeroError] = useState<string | null>(null)
  const heroInputRef = useRef<HTMLInputElement>(null)

  // Gallery State
  const [galleryAlt, setGalleryAlt] = useState('')
  const [galleryProgress, setGalleryProgress] = useState(0)
  const [galleryError, setGalleryError] = useState<string | null>(null)
  const [deletingImageId, setDeletingImageId] = useState<number | string | null>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  const uploadHeroMutation = useUploadHeroImage()
  const uploadGalleryMutation = useUploadGalleryImage()
  const deleteGalleryMutation = useDeleteGalleryImage()

  // ── Handle Hero Image Upload ──────────────────────────────────────────────
  const handleHeroSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    if (file.size > MAX_PRODUCT_IMAGE_SIZE) {
      setHeroError(t('errors.heroImageTooLarge'))
      return
    }
    if (!isAllowedProductImage(file.name, file.type)) {
      setHeroError(t('errors.invalidProductImageType'))
      return
    }

    setHeroError(null)
    setHeroProgress(0)

    const res = await uploadHeroMutation.mutateAsync({
      productUlid,
      file,
      onProgress: (percent) => setHeroProgress(percent),
    })

    if (res.ok) {
      const localUrl = URL.createObjectURL(file)
      setHeroPreview(localUrl)
      // Extract returned hero image url from product resource if available
      const data = res.data as { hero_image_url?: string } | undefined
      if (data?.hero_image_url) {
        onHeroImageUpdated?.(data.hero_image_url)
      } else {
        onHeroImageUpdated?.(localUrl)
      }
    } else {
      setHeroError(res.message || t('errors.uploadFailed'))
    }
  }

  // ── Handle Gallery Image Upload ───────────────────────────────────────────
  const handleGallerySelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    if (file.size > MAX_PRODUCT_IMAGE_SIZE) {
      setGalleryError(t('errors.heroImageTooLarge'))
      return
    }
    if (!isAllowedProductImage(file.name, file.type)) {
      setGalleryError(t('errors.invalidProductImageType'))
      return
    }

    setGalleryError(null)
    setGalleryProgress(0)

    const res = await uploadGalleryMutation.mutateAsync({
      productUlid,
      file,
      altText: galleryAlt.trim() || undefined,
      onProgress: (percent) => setGalleryProgress(percent),
    })

    if (res.ok) {
      setGalleryAlt('')
      onGalleryUpdated?.()
    } else {
      setGalleryError(res.message || t('errors.uploadFailed'))
    }
  }

  // ── Handle Gallery Image Delete ───────────────────────────────────────────
  const handleConfirmDelete = async () => {
    if (!deletingImageId) return

    const res = await deleteGalleryMutation.mutateAsync({
      productUlid,
      imageId: deletingImageId,
    })

    if (res.ok) {
      setDeletingImageId(null)
      onGalleryUpdated?.()
    }
  }

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* ── Section 1: Hero Image ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">{t('heroImage')}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              4MB max (PNG, JPG, JPEG, WebP)
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => heroInputRef.current?.click()}
            disabled={uploadHeroMutation.isPending}
            className="gap-1.5 text-xs"
          >
            <Upload className="size-3.5" />
            {heroPreview ? 'Replace Image' : t('uploadHero')}
          </Button>
          <input
            ref={heroInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleHeroSelect}
          />
        </div>

        {uploadHeroMutation.isPending && (
          <div className="flex items-center gap-2 mt-2">
            <Progress value={heroProgress} className="h-1.5 flex-1" />
            <span className="text-xs text-muted-foreground">{heroProgress}%</span>
          </div>
        )}

        {heroError && (
          <div className="flex items-center gap-1.5 text-xs text-destructive mt-1">
            <AlertCircle className="size-3.5 shrink-0" />
            <span>{heroError}</span>
          </div>
        )}

        {heroPreview ? (
          <div className="relative mt-2 rounded-lg border overflow-hidden bg-muted/20 aspect-video max-w-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroPreview} alt="Product hero" className="size-full object-cover" />
          </div>
        ) : (
          <div
            onClick={() => heroInputRef.current?.click()}
            className="mt-2 flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg border-muted-foreground/20 hover:border-primary/50 cursor-pointer transition-colors max-w-sm"
          >
            <ImageIcon className="size-8 text-muted-foreground mb-1" />
            <span className="text-xs font-medium text-muted-foreground">
              {t('uploadHero')}
            </span>
          </div>
        )}
      </div>

      {/* ── Section 2: Gallery Images ─────────────────────────────────────── */}
      <div className="flex flex-col gap-4 rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">{t('gallery')}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              4MB max per image (PNG, JPG, JPEG, WebP)
            </p>
          </div>
        </div>

        {/* Upload form for gallery image with optional alt text */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end p-4 rounded-lg bg-muted/30 border">
          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="gallery-alt" className="text-xs font-medium">
              {t('altText')}
            </Label>
            <Input
              id="gallery-alt"
              value={galleryAlt}
              onChange={(e) => setGalleryAlt(e.target.value)}
              placeholder={t('altTextPlaceholder')}
              maxLength={255}
              disabled={uploadGalleryMutation.isPending}
            />
          </div>

          <div>
            <Button
              type="button"
              size="sm"
              onClick={() => galleryInputRef.current?.click()}
              disabled={uploadGalleryMutation.isPending}
              className="w-full gap-1.5 text-xs"
            >
              <Plus className="size-3.5" />
              {t('uploadGallery')}
            </Button>
            <input
              ref={galleryInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleGallerySelect}
            />
          </div>
        </div>

        {uploadGalleryMutation.isPending && (
          <div className="flex items-center gap-2">
            <Progress value={galleryProgress} className="h-1.5 flex-1" />
            <span className="text-xs text-muted-foreground">{galleryProgress}%</span>
          </div>
        )}

        {galleryError && (
          <div className="flex items-center gap-1.5 text-xs text-destructive">
            <AlertCircle className="size-3.5 shrink-0" />
            <span>{galleryError}</span>
          </div>
        )}

        {/* Gallery Grid */}
        {galleryImages.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">
            No gallery images added yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
            {galleryImages.map((img) => (
              <div
                key={img.id}
                className="group relative rounded-lg border overflow-hidden aspect-square bg-muted/20"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.alt_text ?? ''}
                  className="size-full object-cover"
                />

                {img.alt_text && (
                  <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] p-1 truncate">
                    {img.alt_text}
                  </div>
                )}

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon-xs"
                    onClick={() => setDeletingImageId(img.id)}
                    title="Delete image"
                    aria-label="Delete gallery image"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Alert */}
      <AlertDialog
        open={Boolean(deletingImageId)}
        onOpenChange={(open) => !open && setDeletingImageId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteConfirmDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {deleteGalleryMutation.isPending ? t('saving') : t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
