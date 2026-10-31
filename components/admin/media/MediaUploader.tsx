'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import {
  UploadCloud,
  File as FileIcon,
  X,
  AlertCircle,
  CheckCircle2,
  RotateCw,
  Folder,
  Tag,
  FileType,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import {
  FOLDER_REGEX,
  MAX_MEDIA_BATCH_COUNT,
  MAX_MEDIA_FILE_SIZE,
  isAllowedMediaFile,
  type MediaResource,
} from '@/types/dto/media.dto'
import { uploadMedia, uploadMediaMultiple } from '@/lib/admin/media-client'

interface UploadItem {
  id: string
  file: File
  previewUrl: string | null
  progress: number
  status: 'idle' | 'uploading' | 'success' | 'error'
  error?: string
  fieldErrors?: Record<string, string[]>
  abortController?: AbortController
  uploadedItem?: MediaResource
}

interface MediaUploaderProps {
  onSuccess?: (items: MediaResource[]) => void
  defaultFolder?: string
  multiple?: boolean
}

export function MediaUploader({
  onSuccess,
  defaultFolder = '',
  multiple = true,
}: MediaUploaderProps) {
  const t = useTranslations('admin.media')
  const [folder, setFolder] = useState(defaultFolder)
  const [altText, setAltText] = useState('')
  const [folderError, setFolderError] = useState<string | null>(null)
  const [items, setItems] = useState<UploadItem[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      items.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
      })
    }
  }, [items])

  const validateFolder = useCallback(
    (value: string): boolean => {
      if (!value || value.trim() === '') {
        setFolderError(null)
        return true
      }
      if (value.length > 200) {
        setFolderError(t('errors.invalidFolder'))
        return false
      }
      if (!FOLDER_REGEX.test(value)) {
        setFolderError(t('errors.invalidFolder'))
        return false
      }
      setFolderError(null)
      return true
    },
    [t],
  )

  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setFolder(val)
    validateFolder(val)
  }

  const addFiles = useCallback(
    (selectedFiles: FileList | File[]) => {
      const incoming = Array.from(selectedFiles)
      if (incoming.length === 0) return

      const availableSlots = multiple ? MAX_MEDIA_BATCH_COUNT - items.length : 1
      if (availableSlots <= 0) {
        alert(t('errors.tooManyFiles'))
        return
      }

      const filesToAdd = incoming.slice(0, availableSlots)
      const newItems: UploadItem[] = filesToAdd.map((file) => {
        const id = `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
        const isImage = file.type.startsWith('image/')
        const previewUrl = isImage ? URL.createObjectURL(file) : null

        let validationError: string | undefined
        if (file.size > MAX_MEDIA_FILE_SIZE) {
          validationError = t('errors.fileTooLarge')
        } else if (!isAllowedMediaFile(file.name, file.type)) {
          validationError = t('errors.invalidType')
        }

        return {
          id,
          file,
          previewUrl,
          progress: 0,
          status: validationError ? 'error' : 'idle',
          error: validationError,
        }
      })

      setItems((prev) => (multiple ? [...prev, ...newItems] : newItems))
    },
    [items.length, multiple, t],
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files) {
      addFiles(e.dataTransfer.files)
    }
  }

  const removeItem = (id: string) => {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id)
      if (target?.abortController) {
        target.abortController.abort()
      }
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl)
      }
      return prev.filter((i) => i.id !== id)
    })
  }

  const cancelUpload = (id: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id && item.abortController) {
          item.abortController.abort()
          return { ...item, status: 'error', error: 'Upload canceled', progress: 0 }
        }
        return item
      }),
    )
  }

  const uploadSingleItem = async (item: UploadItem): Promise<MediaResource | null> => {
    if (!validateFolder(folder)) return null

    const controller = new AbortController()
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? { ...i, status: 'uploading', progress: 0, error: undefined, abortController: controller }
          : i,
      ),
    )

    const res = await uploadMedia(
      item.file,
      {
        folder: folder.trim() || undefined,
        altText: altText.trim() || undefined,
      },
      (percent) => {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, progress: percent } : i)),
        )
      },
      controller.signal,
    )

    if (res.ok) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, status: 'success', progress: 100, uploadedItem: res.data }
            : i,
        ),
      )
      return res.data
    } else {
      let errorMsg = res.message || t('errors.uploadFailed')
      if (res.status === 401) {
        errorMsg = t('errors.unauthorized')
        window.location.href = '/login'
      } else if (res.status === 403) {
        errorMsg = t('errors.forbidden')
      } else if (res.status === 429) {
        errorMsg = t('errors.rateLimited')
      } else if (res.status >= 500) {
        errorMsg = t('errors.serverError')
      }

      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                status: 'error',
                error: errorMsg,
                fieldErrors: res.errors ?? undefined,
              }
            : i,
        ),
      )
      return null
    }
  }

  const handleUploadAll = async () => {
    if (!validateFolder(folder)) return

    const pending = items.filter((i) => i.status === 'idle' || i.status === 'error')
    if (pending.length === 0) return

    // If batch multiple upload endpoint can be used and multiple items are ready without single alt_text
    if (pending.length > 1 && !altText.trim()) {
      const validPending = pending.filter((i) => !i.error || i.status === 'idle')
      if (validPending.length === 0) return

      const controller = new AbortController()
      setItems((prev) =>
        prev.map((i) =>
          validPending.some((vp) => vp.id === i.id)
            ? { ...i, status: 'uploading', progress: 0, abortController: controller }
            : i,
        ),
      )

      const files = validPending.map((i) => i.file)
      const res = await uploadMediaMultiple(
        files,
        { folder: folder.trim() || undefined },
        (percent) => {
          setItems((prev) =>
            prev.map((i) =>
              validPending.some((vp) => vp.id === i.id) ? { ...i, progress: percent } : i,
            ),
          )
        },
        controller.signal,
      )

      if (res.ok) {
        const uploadedList = res.data
        setItems((prev) =>
          prev.map((i) => {
            const uploadedMatch = uploadedList.find((u) => u.original_name === i.file.name)
            return validPending.some((vp) => vp.id === i.id)
              ? {
                  ...i,
                  status: 'success',
                  progress: 100,
                  uploadedItem: uploadedMatch,
                }
              : i
          }),
        )
        onSuccess?.(uploadedList)
        return
      } else {
        const errorMsg = res.message || t('errors.uploadFailed')
        setItems((prev) =>
          prev.map((i) =>
            validPending.some((vp) => vp.id === i.id)
              ? { ...i, status: 'error', error: errorMsg, fieldErrors: res.errors ?? undefined }
              : i,
          ),
        )
        return
      }
    }

    // Otherwise upload sequentially so per-file altText and progress are preserved
    const uploadedResults: MediaResource[] = []
    for (const item of pending) {
      if (item.error && item.status === 'error' && !item.fieldErrors) {
        continue // Skip client-invalid files
      }
      const uploaded = await uploadSingleItem(item)
      if (uploaded) uploadedResults.push(uploaded)
    }

    if (uploadedResults.length > 0) {
      onSuccess?.(uploadedResults)
    }
  }

  const allIdle = items.length > 0 && items.every((i) => i.status === 'idle' || i.status === 'error')
  const isAnyUploading = items.some((i) => i.status === 'uploading')

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Upload settings: Folder and Alt Text */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="media-folder" className="flex items-center gap-1.5 text-sm font-medium">
            <Folder className="size-4 text-muted-foreground" />
            {t('folder')}
          </Label>
          <Input
            id="media-folder"
            value={folder}
            onChange={handleFolderChange}
            placeholder={t('folderPlaceholder')}
            className={folderError ? 'border-destructive' : ''}
            disabled={isAnyUploading}
          />
          {folderError && <p className="text-xs text-destructive">{folderError}</p>}
        </div>

        {!multiple || items.length <= 1 ? (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="media-alt" className="flex items-center gap-1.5 text-sm font-medium">
              <Tag className="size-4 text-muted-foreground" />
              {t('altText')}
            </Label>
            <Input
              id="media-alt"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder={t('altTextPlaceholder')}
              maxLength={500}
              disabled={isAnyUploading}
            />
          </div>
        ) : null}
      </div>

      {/* Drag and Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-all cursor-pointer text-center ${
          isDragging
            ? 'border-primary bg-primary/5 scale-[0.99]'
            : 'border-border hover:border-primary/50 hover:bg-muted/30'
        }`}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label={t('dragDropTitle')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            fileInputRef.current?.click()
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files)
            e.target.value = ''
          }}
        />

        <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
          <UploadCloud className="size-7 text-primary" />
        </div>

        <p className="text-base font-semibold">{t('dragDropTitle')}</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">{t('dragDropHint')}</p>
        <p className="text-[11px] text-muted-foreground/80 mt-1">{t('maxFilesHint')}</p>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={(e) => {
            e.stopPropagation()
            fileInputRef.current?.click()
          }}
        >
          {t('browse')}
        </Button>
      </div>

      {/* Staged files list */}
      {items.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {items.length} {items.length === 1 ? 'file' : 'files'} selected
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setItems([])}
                disabled={isAnyUploading}
              >
                Clear all
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleUploadAll}
                disabled={!allIdle || isAnyUploading || Boolean(folderError)}
              >
                {t('upload')} ({items.filter((i) => i.status !== 'success').length})
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card text-card-foreground shadow-xs"
              >
                {/* Thumbnail or icon */}
                <div className="size-12 shrink-0 rounded-md overflow-hidden bg-muted flex items-center justify-center border">
                  {item.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.previewUrl}
                      alt={item.file.name}
                      className="size-full object-cover"
                    />
                  ) : (
                    <FileType className="size-6 text-muted-foreground" />
                  )}
                </div>

                {/* File Info & Progress */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">{item.file.name}</p>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {(item.file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>

                  {item.status === 'uploading' && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <Progress value={item.progress} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground w-8 text-end">
                        {item.progress}%
                      </span>
                    </div>
                  )}

                  {item.status === 'error' && (
                    <div className="flex items-center gap-1.5 text-xs text-destructive mt-1">
                      <AlertCircle className="size-3.5 shrink-0" />
                      <span className="truncate">{item.error || t('errors.uploadFailed')}</span>
                    </div>
                  )}

                  {item.status === 'success' && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                      <CheckCircle2 className="size-3.5 shrink-0" />
                      <span>Uploaded successfully</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {item.status === 'uploading' && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => cancelUpload(item.id)}
                      title="Cancel"
                      aria-label="Cancel upload"
                    >
                      <X className="size-4" />
                    </Button>
                  )}

                  {item.status === 'error' && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => uploadSingleItem(item)}
                      title={t('retry')}
                      aria-label={t('retry')}
                    >
                      <RotateCw className="size-4" />
                    </Button>
                  )}

                  {item.status !== 'uploading' && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => removeItem(item.id)}
                      title="Remove"
                      aria-label="Remove item"
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
