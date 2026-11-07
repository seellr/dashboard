'use client'
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ImageIcon, RefreshCw, Trash2, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  bulkDeleteSellerMedia,
  deleteSellerMedia,
  listSellerMedia,
  listSellerMediaFolders,
  updateSellerMedia,
  type SellerMedia,
} from '@/lib/seller/resource-client'
import {
  FOLDER_REGEX,
  MAX_MEDIA_BATCH_COUNT,
  MAX_MEDIA_FILE_SIZE,
  getMediaUrl,
  isAllowedMediaFile,
} from '@/types/dto/media.dto'

interface MediaLibraryProps {
  accept?: string
  selectionMode?: boolean
  selectedUlid?: string | null
  onSelect?: (media: SellerMedia) => void
  compact?: boolean
}

interface UploadState {
  active: boolean
  progress: number
  error: string | null
  files: File[]
  folder: string
}

const EMPTY_UPLOAD: UploadState = {
  active: false,
  progress: 0,
  error: null,
  files: [],
  folder: '',
}

export function MediaLibrary({
  accept,
  selectionMode = false,
  selectedUlid = null,
  onSelect,
  compact = false,
}: MediaLibraryProps) {
  const t = useTranslations('seller.media')
  const [items, setItems] = useState<SellerMedia[]>([])
  const [folders, setFolders] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [folder, setFolder] = useState('')
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [editing, setEditing] = useState<SellerMedia | null>(null)
  const [editName, setEditName] = useState('')
  const [editAlt, setEditAlt] = useState('')
  const [upload, setUpload] = useState<UploadState>(EMPTY_UPLOAD)
  const inputRef = useRef<HTMLInputElement>(null)
  const xhrRef = useRef<XMLHttpRequest | null>(null)

  const load = useCallback(
    async (append = false, nextCursor?: string | null) => {
      setLoading(true)
      const params = new URLSearchParams({ per_page: compact ? '12' : '15' })
      if (search.trim()) params.set('search', search.trim())
      if (folder) params.set('folder', folder)
      if (append && nextCursor) params.set('cursor', nextCursor)
      const result = await listSellerMedia(`?${params.toString()}`)
      setLoading(false)
      if (!result.ok) {
        setMessage(result.message)
        return
      }
      setMessage('')
      setItems((previous) =>
        append ? [...previous, ...result.data.items] : result.data.items,
      )
      setCursor(result.data.meta?.next_cursor ?? null)
      setHasMore(result.data.meta?.has_more === true)
    },
    [compact, folder, search],
  )

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load()
      void listSellerMediaFolders().then((result) => {
        if (result.ok) setFolders(result.data)
      })
    }, 250)
    return () => window.clearTimeout(timer)
  }, [load])

  const validateFiles = (files: File[]): string | null => {
    if (files.length === 0) return t('errors.noFiles')
    if (files.length > MAX_MEDIA_BATCH_COUNT) return t('errors.tooMany')
    if (files.some((file) => file.size > MAX_MEDIA_FILE_SIZE)) {
      return t('errors.tooLarge')
    }
    if (files.some((file) => !isAllowedMediaFile(file.name, file.type))) {
      return t('errors.invalidType')
    }
    if (upload.folder && !FOLDER_REGEX.test(upload.folder)) {
      return t('errors.invalidFolder')
    }
    return null
  }

  const startUpload = (files: File[]) => {
    const error = validateFiles(files)
    if (error) {
      setUpload({ ...EMPTY_UPLOAD, error })
      return
    }
    setUpload({ active: false, progress: 0, error: null, files, folder })
  }

  const confirmUpload = () => {
    if (upload.files.length === 0) return
    if (upload.folder && !FOLDER_REGEX.test(upload.folder)) {
      setUpload((current) => ({ ...current, error: t('errors.invalidFolder') }))
      return
    }
    const body = new FormData()
    if (upload.files.length === 1) body.append('file', upload.files[0])
    else for (const file of upload.files) body.append('files[]', file)
    if (upload.folder) body.append('folder', upload.folder)

    const endpoint =
      upload.files.length === 1
        ? '/api/subscriber/media/upload'
        : '/api/subscriber/media/upload-multiple'

    const xhr = new XMLHttpRequest()
    xhrRef.current = xhr
    xhr.open('POST', endpoint)
    xhr.setRequestHeader('x-locale', document.documentElement.lang === 'ar' ? 'ar' : 'en')
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setUpload((current) => ({
          ...current,
          active: true,
          progress: Math.round((event.loaded / event.total) * 100),
        }))
      }
    }
    xhr.onerror = () => {
      setUpload((current) => ({ ...current, active: false, error: t('errors.upload') }))
    }
    xhr.onabort = () => {
      setUpload((current) => ({ ...current, active: false, error: t('errors.cancelled') }))
    }
    xhr.onload = () => {
      xhrRef.current = null
      if (xhr.status >= 200 && xhr.status < 300) {
        setUpload(EMPTY_UPLOAD)
        if (inputRef.current) inputRef.current.value = ''
        void load()
        return
      }
      let uploadMessage = t('errors.upload')
      try {
        const payload = JSON.parse(xhr.responseText) as { message?: string }
        if (typeof payload.message === 'string') uploadMessage = payload.message
      } catch {
        // Keep the localized fallback.
      }
      setUpload((current) => ({ ...current, active: false, error: uploadMessage }))
    }
    setUpload((current) => ({ ...current, active: true, progress: 0, error: null }))
    xhr.send(body)
  }

  const cancelUpload = () => {
    xhrRef.current?.abort()
    xhrRef.current = null
    setUpload(EMPTY_UPLOAD)
  }

  const removeSelected = async () => {
    if (selected.length === 0) return
    if (!window.confirm(t('confirmBulk', { count: selected.length }))) return
    const result = await bulkDeleteSellerMedia(selected)
    if (!result.ok) {
      setMessage(result.message)
      return
    }
    setSelected([])
    await load()
  }

  const saveDetails = async () => {
    if (!editing) return
    const result = await updateSellerMedia(editing.ulid, {
      name: editName,
      alt_text: editAlt || null,
      folder: editing.folder ?? null,
    })
    if (!result.ok) {
      setMessage(result.message)
      return
    }
    setEditing(null)
    await load()
  }

  const visibleItems = useMemo(() => items, [items])

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('search')}
          aria-label={t('search')}
          className="max-w-xs"
        />
        <select
          aria-label={t('folderFilter')}
          value={folder}
          onChange={(event) => setFolder(event.target.value)}
          className="h-8 rounded-lg border bg-background px-2 text-sm"
        >
          <option value="">{t('allFolders')}</option>
          {folders.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          className="sr-only"
          onChange={(event) => startUpload(Array.from(event.target.files ?? []))}
        />
        <Button type="button" onClick={() => inputRef.current?.click()} className="gap-2">
          <Upload className="size-4" aria-hidden="true" />
          {t('upload')}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => void load()}
          className="gap-2"
          disabled={loading}
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          {t('refresh')}
        </Button>
        {!selectionMode && (
          <Button
            type="button"
            variant="outline"
            disabled={selected.length === 0}
            onClick={() => void removeSelected()}
            className="gap-2"
          >
            <Trash2 className="size-4" aria-hidden="true" />
            {t('deleteSelected')}
          </Button>
        )}
      </div>

      {upload.files.length > 0 && (
        <div className="space-y-2 rounded-lg border p-3" role="status">
          <p className="text-sm font-medium">
            {t('uploadQueue', { count: upload.files.length })}
          </p>
          <Input
            value={upload.folder}
            onChange={(event) =>
              setUpload((current) => ({ ...current, folder: event.target.value }))
            }
            placeholder={t('folderPlaceholder')}
            aria-label={t('folderPlaceholder')}
            maxLength={200}
          />
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${upload.progress}%` }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={confirmUpload} disabled={upload.active}>
              {upload.active ? t('uploading', { progress: upload.progress }) : t('confirmUpload')}
            </Button>
            <Button type="button" variant="outline" onClick={cancelUpload}>
              {t('cancel')}
            </Button>
          </div>
        </div>
      )}

      {(message || upload.error) && (
        <p role="alert" className="text-sm text-destructive">
          {upload.error ?? message}
        </p>
      )}

      {loading && items.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          {t('loading')}
        </p>
      ) : visibleItems.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center">
          <ImageIcon className="size-8 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        </div>
      ) : (
        <div
          className={
            compact
              ? 'grid gap-3 sm:grid-cols-3'
              : 'grid gap-3 sm:grid-cols-2 lg:grid-cols-4'
          }
        >
          {visibleItems.map((item) => {
            const checked = selectionMode
              ? selectedUlid === item.ulid
              : selected.includes(item.ulid)
            return (
              <article
                key={item.ulid}
                className="overflow-hidden rounded-lg border"
                data-selected={checked || undefined}
              >
                <button
                  type="button"
                  className="block w-full text-start outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  aria-pressed={checked}
                  onClick={() => {
                    if (selectionMode) onSelect?.(item)
                    else
                      setSelected((current) =>
                        current.includes(item.ulid)
                          ? current.filter((id) => id !== item.ulid)
                          : [...current, item.ulid],
                      )
                  }}
                >
                  {item.thumb_url || item.url ? (
                    <img
                      src={getMediaUrl(item.thumb_url || item.url)}
                      alt={item.alt_text ?? item.name ?? item.original_name ?? ''}
                      className="aspect-video w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-video items-center justify-center bg-muted">
                      <ImageIcon className="size-8 text-muted-foreground" aria-hidden="true" />
                    </div>
                  )}
                  <div className="flex items-center gap-2 p-3">
                    {!selectionMode && (
                      <input
                        type="checkbox"
                        readOnly
                        checked={checked}
                        aria-label={t('selectFile', { name: item.name ?? item.original_name ?? item.ulid })}
                      />
                    )}
                    <span className="truncate text-sm">
                      {item.name ?? item.original_name ?? item.ulid}
                    </span>
                  </div>
                </button>
                {!selectionMode && (
                  <div className="flex gap-2 border-t p-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditing(item)
                        setEditName(item.name ?? '')
                        setEditAlt(item.alt_text ?? '')
                      }}
                    >
                      {t('details')}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        if (!window.confirm(t('confirmDelete'))) return
                        void deleteSellerMedia(item.ulid).then((result) => {
                          if (!result.ok) setMessage(result.message)
                          else void load()
                        })
                      }}
                    >
                      {t('delete')}
                    </Button>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}

      {hasMore && (
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={() => void load(true, cursor)}
        >
          {t('loadMore')}
        </Button>
      )}

      {editing && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="media-details-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        >
          <div className="w-full max-w-md space-y-4 rounded-xl bg-background p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 id="media-details-title" className="text-lg font-semibold">
                {t('detailsTitle')}
              </h2>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => setEditing(null)}
                aria-label={t('close')}
              >
                <X className="size-4" />
              </Button>
            </div>
            <Input
              value={editName}
              onChange={(event) => setEditName(event.target.value)}
              placeholder={t('name')}
              aria-label={t('name')}
              maxLength={200}
            />
            <Input
              value={editAlt}
              onChange={(event) => setEditAlt(event.target.value)}
              placeholder={t('altText')}
              aria-label={t('altText')}
              maxLength={500}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                {t('cancel')}
              </Button>
              <Button type="button" onClick={() => void saveDetails()}>
                {t('save')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
