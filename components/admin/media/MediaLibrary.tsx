'use client'

import { useState, useTransition, useCallback, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import {
  Search,
  Filter,
  FolderOpen,
  Trash2,
  RotateCw,
  FileText,
  Video,
  FileArchive,
  Image as ImageIcon,
  Check,
  CheckSquare,
  Square,
  AlertCircle,
  FileUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  useBulkDeleteMedia,
  useMediaFolders,
  type MediaItem,
} from '@/hooks/queries/useMedia'
import { listMedia } from '@/lib/admin/media-client'

interface MediaLibraryProps {
  onSelectItem?: (item: MediaItem) => void
  selectedUlids?: string[]
  onToggleSelect?: (item: MediaItem) => void
  selectable?: boolean
  multipleSelection?: boolean
  onOpenDetails?: (item: MediaItem) => void
  onUploadClick?: () => void
}

export function MediaLibrary({
  onSelectItem,
  selectedUlids = [],
  onToggleSelect,
  selectable = false,
  multipleSelection = false,
  onOpenDetails,
  onUploadClick,
}: MediaLibraryProps) {
  const t = useTranslations('admin.media')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [folder, setFolder] = useState<string>('all')
  const [type, setType] = useState<string>('all')

  const [items, setItems] = useState<MediaItem[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [localSelected, setLocalSelected] = useState<string[]>(selectedUlids)
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)

  const { data: folders = [] } = useMediaFolders()
  const bulkDeleteMutation = useBulkDeleteMedia()

  // Sync external selection
  useEffect(() => {
    setLocalSelected(selectedUlids)
  }, [selectedUlids])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 350)
    return () => clearTimeout(timer)
  }, [search])

  const fetchItems = useCallback(
    async (resetList = true, nextCursor: string | null = null) => {
      if (resetList) {
        setIsLoading(true)
      } else {
        setIsLoadingMore(true)
      }
      setFetchError(null)

      const res = await listMedia({
        search: debouncedSearch.trim() || undefined,
        folder: folder !== 'all' ? folder : undefined,
        type: type !== 'all' ? type : undefined,
        cursor: nextCursor,
        per_page: 24,
      })

      if (res.ok) {
        setItems((prev) => (resetList ? res.data : [...prev, ...res.data]))
        setCursor(res.meta?.next_cursor ?? null)
        setHasMore(Boolean(res.meta?.has_more))
      } else {
        setFetchError(res.message || t('errors.failedToLoad'))
      }

      setIsLoading(false)
      setIsLoadingMore(false)
    },
    [debouncedSearch, folder, type, t],
  )

  useEffect(() => {
    fetchItems(true, null)
  }, [fetchItems])

  const handleLoadMore = () => {
    if (hasMore && cursor && !isLoadingMore) {
      fetchItems(false, cursor)
    }
  }

  const toggleSelect = (item: MediaItem, e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (!selectable) {
      onOpenDetails?.(item)
      return
    }

    if (onToggleSelect) {
      onToggleSelect(item)
      return
    }

    if (multipleSelection) {
      setLocalSelected((prev) =>
        prev.includes(item.ulid) ? prev.filter((id) => id !== item.ulid) : [...prev, item.ulid],
      )
    } else {
      setLocalSelected([item.ulid])
      onSelectItem?.(item)
    }
  }

  const handleSelectAll = () => {
    if (localSelected.length === items.length) {
      setLocalSelected([])
    } else {
      setLocalSelected(items.map((i) => i.ulid))
    }
  }

  const handleBulkDelete = async () => {
    if (localSelected.length === 0) return

    const res = await bulkDeleteMutation.mutateAsync(localSelected)
    if (res.ok) {
      setItems((prev) => prev.filter((i) => !localSelected.includes(i.ulid)))
      setLocalSelected([])
      setShowBulkDeleteConfirm(false)
    }
  }

  const getMediaIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="size-5" />
    if (mimeType.startsWith('video/')) return <Video className="size-5" />
    if (mimeType.includes('zip')) return <FileArchive className="size-5" />
    return <FileText className="size-5" />
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Top Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('search')}
              className="ps-9"
            />
          </div>

          <Select value={folder} onValueChange={(val) => setFolder(val ?? 'all')}>
            <SelectTrigger className="w-36 sm:w-44">
              <FolderOpen className="size-4 shrink-0 text-muted-foreground me-1.5" />
              <SelectValue placeholder={t('allFolders')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allFolders')}</SelectItem>
              {folders.map((f) => (
                <SelectItem key={f} value={f}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={type} onValueChange={(val) => setType(val ?? 'all')}>
            <SelectTrigger className="w-32 sm:w-36">
              <SelectValue placeholder={t('allTypes')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('types.all')}</SelectItem>
              <SelectItem value="image">{t('types.image')}</SelectItem>
              <SelectItem value="document">{t('types.document')}</SelectItem>
              <SelectItem value="video">{t('types.video')}</SelectItem>
              <SelectItem value="archive">{t('types.archive')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Multi-selection action bar */}
        {selectable && multipleSelection && items.length > 0 && (
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="text-xs"
            >
              {localSelected.length === items.length ? t('deselectAll') : t('selectAll')}
            </Button>

            {localSelected.length > 0 && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setShowBulkDeleteConfirm(true)}
                className="gap-1.5 text-xs"
                disabled={bulkDeleteMutation.isPending}
              >
                <Trash2 className="size-3.5" />
                {t('bulkDelete')} ({localSelected.length})
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Error state */}
      {fetchError && (
        <div className="flex items-center justify-between p-4 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{fetchError}</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fetchItems(true, null)}
            className="gap-1.5 text-xs"
          >
            <RotateCw className="size-3.5" />
            {t('retry')}
          </Button>
        </div>
      )}

      {/* Loading state skeleton */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="aspect-square w-full rounded-xl" />
              <Skeleton className="h-3.5 w-3/4 rounded" />
              <Skeleton className="h-2.5 w-1/2 rounded" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed rounded-xl bg-muted/10">
          <div className="size-14 rounded-full bg-muted flex items-center justify-center mb-3">
            <FolderOpen className="size-7 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold">{t('emptyTitle')}</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            {t('emptyDescription')}
          </p>
          {onUploadClick && (
            <Button
              type="button"
              size="sm"
              onClick={onUploadClick}
              className="mt-4 gap-1.5"
            >
              <FileUp className="size-4" />
              {t('uploadNew')}
            </Button>
          )}
        </div>
      ) : (
        /* Grid of media items */
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {items.map((item) => {
              const isSelected = localSelected.includes(item.ulid)

              return (
                <div
                  key={item.ulid}
                  onClick={(e) => toggleSelect(item, e)}
                  role="button"
                  tabIndex={0}
                  aria-selected={isSelected}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      toggleSelect(item)
                    }
                  }}
                  className={`group relative flex flex-col rounded-xl border overflow-hidden transition-all text-start cursor-pointer select-none bg-card ${
                    isSelected
                      ? 'ring-2 ring-primary border-primary shadow-sm'
                      : 'hover:border-primary/50 hover:shadow-xs'
                  }`}
                >
                  {/* Thumbnail Container */}
                  <div className="relative aspect-square w-full bg-muted/40 overflow-hidden flex items-center justify-center">
                    {item.thumb_url || item.is_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.thumb_url || item.url}
                        alt={item.alt_text ?? item.name}
                        loading="lazy"
                        className="size-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                    ) : (
                      <div className="text-muted-foreground group-hover:text-foreground transition-colors">
                        {getMediaIcon(item.mime_type)}
                      </div>
                    )}

                    {/* Selection Checkbox overlay */}
                    {selectable && (
                      <div
                        className={`absolute top-2 start-2 size-6 rounded-md flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-primary text-primary-foreground shadow-xs'
                            : 'bg-black/40 text-white/80 opacity-0 group-hover:opacity-100 hover:bg-black/60'
                        }`}
                      >
                        <Check className="size-3.5 stroke-[3]" />
                      </div>
                    )}

                    {/* Folder Badge */}
                    {item.folder && (
                      <Badge
                        variant="secondary"
                        className="absolute bottom-1.5 start-1.5 text-[10px] px-1.5 py-0 h-4 bg-background/80 backdrop-blur-xs max-w-[85%] truncate"
                      >
                        {item.folder}
                      </Badge>
                    )}
                  </div>

                  {/* Metadata label */}
                  <div className="p-2 flex flex-col gap-0.5">
                    <p className="text-xs font-medium truncate" title={item.name}>
                      {item.name}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{(item.file_size / 1024).toFixed(0)} KB</span>
                      {item.width && item.height && (
                        <span>
                          {item.width}×{item.height}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center pt-2 pb-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="gap-2 text-xs"
              >
                {isLoadingMore ? <RotateCw className="size-3.5 animate-spin" /> : null}
                {t('loadMore')}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Bulk Delete Alert */}
      <AlertDialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('bulkDeleteConfirmTitle', { count: localSelected.length })}
            </AlertDialogTitle>
            <AlertDialogDescription>{t('bulkDeleteConfirmDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {bulkDeleteMutation.isPending ? t('saving') : t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
