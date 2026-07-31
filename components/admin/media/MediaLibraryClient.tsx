'use client'

import { useState, useRef } from 'react'
import { Upload, Search, Trash2, FolderOpen, X, Image as ImageIcon } from 'lucide-react'
import { sileo } from 'sileo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  useMediaList, useMediaFolders, useUploadMedia, useDeleteMedia, type MediaItem,
} from '@/hooks/queries/useMedia'

export function MediaLibraryClient() {
  const [search, setSearch] = useState('')
  const [folder, setFolder] = useState<string | undefined>(undefined)
  const [type, setType] = useState<string | undefined>(undefined)
  const [deleting, setDeleting] = useState<MediaItem | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const { data, isLoading } = useMediaList({ search: search || undefined, folder, type })
  const { data: folders = [] } = useMediaFolders()
  const upload = useUploadMedia()
  const deleteMedia = useDeleteMedia()

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    let failed = 0
    for (const file of files) {
      const result = await upload.mutateAsync({ file, folder })
      if (!result.ok) failed++
    }

    if (failed > 0) sileo.error({ title: `${failed} file(s) failed to upload` })
    else sileo.success({ title: `${files.length} file(s) uploaded` })
    e.target.value = ''
  }

  async function handleDelete() {
    if (!deleting) return
    const result = await deleteMedia.mutateAsync(deleting.ulid)
    if (!result.ok) {
      sileo.error({ title: 'Could not delete file' })
    } else {
      sileo.success({ title: 'File deleted' })
    }
    setDeleting(null)
  }

  const items = data?.items ?? []

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Sidebar: folders */}
      <aside className="w-48 shrink-0 flex flex-col gap-1">
        <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Folders</p>
        <button
          type="button"
          onClick={() => setFolder(undefined)}
          className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-start transition-colors ${
            folder === undefined ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-accent/50'
          }`}
        >
          <FolderOpen className="h-4 w-4 shrink-0" />
          All files
        </button>
        {folders.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFolder(f)}
            className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-start transition-colors ${
              folder === f ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-accent/50'
            }`}
          >
            <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{f}</span>
          </button>
        ))}
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col gap-4 min-w-0">
        {/* Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-40">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="pl-9"
            />
          </div>
          {/* Type filter chips */}
          <div className="flex gap-1">
            {[undefined, 'image', 'video', 'pdf'].map((t_) => (
              <button
                key={t_ ?? 'all'}
                type="button"
                onClick={() => setType(t_)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  type === t_ ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent'
                }`}
              >
                {t_ ?? 'All'}
              </button>
            ))}
          </div>
          <Button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={upload.isPending}
          >
            <Upload className="h-4 w-4 mr-1.5" />
            {upload.isPending ? 'Uploading…' : 'Upload'}
          </Button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">Loading…</div>
          ) : items.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
              <ImageIcon className="h-12 w-12 opacity-20" />
              <p className="text-sm">No files yet. Upload to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {items.map((item) => (
                <div key={item.ulid} className="group relative flex flex-col gap-1">
                  <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
                    {item.is_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.thumb_url ?? item.url}
                        alt={item.alt_text ?? item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Badge variant="outline" className="text-xs">{item.mime_type.split('/')[1]}</Badge>
                      </div>
                    )}
                    {/* Delete button on hover */}
                    <button
                      type="button"
                      onClick={() => setDeleting(item)}
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 shadow transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="truncate text-xs text-muted-foreground px-0.5">{item.name}</p>
                  <p className="text-xs text-muted-foreground/60 px-0.5">{item.file_size_kb} KB</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* File input */}
      <input ref={fileRef} type="file" multiple className="hidden" onChange={handleFiles} />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this file?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleting?.name}</strong> will be permanently deleted from the media library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
