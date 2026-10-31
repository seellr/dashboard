'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Copy,
  Check,
  Trash2,
  ExternalLink,
  Calendar,
  FileText,
  Image as ImageIcon,
  Folder,
  Layers,
  Save,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  UpdateMediaSchema,
  type MediaResource,
  type UpdateMediaInput,
} from '@/types/dto/media.dto'
import { useDeleteMedia, useUpdateMedia } from '@/hooks/queries/useMedia'

interface MediaDetailsSheetProps {
  media: MediaResource | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted?: (ulid: string) => void
  onUpdated?: (updated: MediaResource) => void
}

export function MediaDetailsSheet({
  media,
  open,
  onOpenChange,
  onDeleted,
  onUpdated,
}: MediaDetailsSheetProps) {
  const t = useTranslations('admin.media')
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [copiedUlid, setCopiedUlid] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const updateMutation = useUpdateMedia()
  const deleteMutation = useDeleteMedia()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<UpdateMediaInput>({
    resolver: zodResolver(UpdateMediaSchema),
    defaultValues: {
      name: '',
      alt_text: '',
      folder: '',
    },
  })

  useEffect(() => {
    if (media) {
      reset({
        name: media.name || '',
        alt_text: media.alt_text ?? '',
        folder: media.folder ?? '',
      })
    }
  }, [media, reset])

  if (!media) return null

  const handleCopy = async (text: string, type: 'url' | 'ulid') => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'url') {
        setCopiedUrl(true)
        setTimeout(() => setCopiedUrl(false), 2000)
      } else {
        setCopiedUlid(true)
        setTimeout(() => setCopiedUlid(false), 2000)
      }
    } catch {
      // fallback
    }
  }

  const onSubmit = async (data: UpdateMediaInput) => {
    const payload: UpdateMediaInput = {
      name: data.name?.trim() || undefined,
      alt_text: data.alt_text !== undefined ? data.alt_text.trim() || null : undefined,
      folder: data.folder !== undefined ? data.folder.trim() || null : undefined,
    }

    const result = await updateMutation.mutateAsync({
      ulid: media.ulid,
      data: payload,
    })

    if (result.ok && result.data) {
      onUpdated?.(result.data)
      reset({
        name: result.data.name,
        alt_text: result.data.alt_text ?? '',
        folder: result.data.folder ?? '',
      })
    }
  }

  const handleDelete = async () => {
    const result = await deleteMutation.mutateAsync(media.ulid)
    if (result.ok) {
      setShowDeleteConfirm(false)
      onOpenChange(false)
      onDeleted?.(media.ulid)
    }
  }

  const formatSize = (bytes: number): string => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto flex flex-col p-6">
          <SheetHeader className="text-start pb-4 border-b">
            <SheetTitle className="text-lg font-semibold">{t('details')}</SheetTitle>
            <SheetDescription className="truncate text-xs text-muted-foreground">
              {media.original_name}
            </SheetDescription>
          </SheetHeader>

          {/* Preview Box */}
          <div className="w-full mt-4 rounded-xl border bg-muted/40 overflow-hidden flex items-center justify-center min-h-48 relative">
            {media.is_image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={media.url}
                alt={media.alt_text ?? media.name}
                className="max-h-64 w-full object-contain"
              />
            ) : media.mime_type.startsWith('video/') ? (
              <video src={media.url} controls className="max-h-64 w-full" />
            ) : (
              <div className="flex flex-col items-center gap-2 p-8 text-muted-foreground">
                <FileText className="size-16" />
                <span className="text-xs font-medium uppercase tracking-wider">
                  {media.mime_type}
                </span>
              </div>
            )}
          </div>

          {/* Quick Copy Link & External view */}
          <div className="flex items-center gap-2 mt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 text-xs gap-1.5"
              onClick={() => handleCopy(media.url, 'url')}
            >
              {copiedUrl ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
              {copiedUrl ? t('copied') : t('copyLink')}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              asChild
              aria-label="Open in new tab"
            >
              <a href={media.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-3.5" />
              </a>
            </Button>
          </div>

          {/* Meta Specifications */}
          <div className="mt-4 grid grid-cols-2 gap-2 p-3 rounded-lg bg-muted/30 border text-xs">
            <div>
              <span className="text-muted-foreground">{t('size')}:</span>
              <p className="font-medium mt-0.5">{formatSize(media.file_size)}</p>
            </div>
            {media.width && media.height ? (
              <div>
                <span className="text-muted-foreground">{t('dimensions')}:</span>
                <p className="font-medium mt-0.5">
                  {media.width} × {media.height} px
                </p>
              </div>
            ) : null}
            <div>
              <span className="text-muted-foreground">{t('mimeType')}:</span>
              <p className="font-medium mt-0.5 truncate">{media.mime_type}</p>
            </div>
            <div>
              <span className="text-muted-foreground">{t('createdAt')}:</span>
              <p className="font-medium mt-0.5">
                {new Date(media.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="col-span-2 pt-1 border-t flex items-center justify-between">
              <span className="text-muted-foreground">{t('ulid')}:</span>
              <button
                type="button"
                onClick={() => handleCopy(media.ulid, 'ulid')}
                className="font-mono text-[11px] text-primary hover:underline flex items-center gap-1"
                title="Click to copy ULID"
              >
                {media.ulid}
                {copiedUlid ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
              </button>
            </div>
          </div>

          {/* Edit Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-5 flex-1">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="media-edit-name" className="text-xs font-medium">
                {t('name')}
              </Label>
              <Input
                id="media-edit-name"
                {...register('name')}
                placeholder="File name"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="media-edit-alt" className="text-xs font-medium">
                {t('altText')}
              </Label>
              <Textarea
                id="media-edit-alt"
                {...register('alt_text')}
                placeholder={t('altTextPlaceholder')}
                rows={2}
                className={errors.alt_text ? 'border-destructive' : ''}
              />
              {errors.alt_text && (
                <p className="text-xs text-destructive">{errors.alt_text.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="media-edit-folder" className="text-xs font-medium">
                {t('folder')}
              </Label>
              <Input
                id="media-edit-folder"
                {...register('folder')}
                placeholder={t('folderPlaceholder')}
                className={errors.folder ? 'border-destructive' : ''}
              />
              {errors.folder && (
                <p className="text-xs text-destructive">{errors.folder.message}</p>
              )}
            </div>

            {updateMutation.isError && (
              <p className="text-xs text-destructive">
                {updateMutation.error instanceof Error
                  ? updateMutation.error.message
                  : t('errors.serverError')}
              </p>
            )}

            <div className="mt-auto pt-6 flex items-center justify-between gap-2 border-t">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="gap-1.5"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="size-3.5" />
                {t('delete')}
              </Button>

              <Button
                type="submit"
                size="sm"
                className="gap-1.5"
                disabled={!isDirty || isSubmitting || updateMutation.isPending}
              >
                <Save className="size-3.5" />
                {updateMutation.isPending ? t('saving') : t('save')}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteConfirmDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {deleteMutation.isPending ? t('saving') : t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
