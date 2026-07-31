'use client'

import { useState, useRef } from 'react'
import { Image as ImageIcon, Upload, X, Search, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { useMediaList, useUploadMedia, type MediaItem } from '@/hooks/queries/useMedia'

interface MediaPickerProps {
  value?: string | null
  onChange: (url: string, item: MediaItem) => void
  onClear?: () => void
  label?: string
  accept?: string
}

export function MediaPicker({ value, onChange, onClear, label = 'Choose image', accept = 'image/*' }: MediaPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<MediaItem | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const { data, isLoading } = useMediaList({ type: 'image', search: search || undefined })
  const upload = useUploadMedia()

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const result = await upload.mutateAsync({ file })
    if (result.ok && result.data) {
      onChange(result.data.url, result.data)
      setOpen(false)
    }
    e.target.value = ''
  }

  function handleSelect(item: MediaItem) {
    setSelected(item)
  }

  function handleConfirm() {
    if (!selected) return
    onChange(selected.url, selected)
    setOpen(false)
    setSelected(null)
  }

  return (
    <div className="flex flex-col gap-2">
      {value ? (
        <div className="relative w-full max-w-xs">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-32 w-full rounded-lg border object-cover" />
          <div className="absolute inset-0 flex items-end justify-end gap-1 p-2">
            <Dialog open={open} onOpenChange={setOpen}>
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex h-7 items-center rounded-md bg-secondary px-2 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 outline-none focus-visible:ring-2"
              >
                Change
              </button>
              <MediaPickerDialog
                search={search}
                setSearch={setSearch}
                items={data?.items ?? []}
                isLoading={isLoading}
                selected={selected}
                onSelect={handleSelect}
                onConfirm={handleConfirm}
                onUpload={() => fileRef.current?.click()}
                uploading={upload.isPending}
              />
            </Dialog>
            {onClear && (
              <Button type="button" size="sm" variant="destructive" className="h-7 text-xs" onClick={onClear}>
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-32 w-full max-w-xs flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-muted-foreground transition-colors hover:border-primary hover:text-primary outline-none focus-visible:ring-2"
          >
            <ImageIcon className="h-6 w-6" />
            <span className="text-xs font-medium">{label}</span>
          </button>
          <MediaPickerDialog
            search={search}
            setSearch={setSearch}
            items={data?.items ?? []}
            isLoading={isLoading}
            selected={selected}
            onSelect={handleSelect}
            onConfirm={handleConfirm}
            onUpload={() => fileRef.current?.click()}
            uploading={upload.isPending}
          />
        </Dialog>
      )}
      <input ref={fileRef} type="file" accept={accept} className="hidden" onChange={handleFile} />
    </div>
  )
}

function MediaPickerDialog({
  search, setSearch, items, isLoading, selected, onSelect, onConfirm, onUpload, uploading,
}: {
  search: string
  setSearch: (v: string) => void
  items: MediaItem[]
  isLoading: boolean
  selected: MediaItem | null
  onSelect: (item: MediaItem) => void
  onConfirm: () => void
  onUpload: () => void
  uploading: boolean
}) {
  return (
    <DialogContent className="max-w-3xl">
      <DialogHeader>
        <DialogTitle>Media library</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-4">
        {/* Toolbar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search images…"
              className="pl-9"
            />
          </div>
          <Button type="button" variant="outline" onClick={onUpload} disabled={uploading}>
            <Upload className="h-4 w-4 mr-1.5" />
            {uploading ? 'Uploading…' : 'Upload new'}
          </Button>
        </div>

        {/* Grid */}
        <div className="h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading…</div>
          ) : items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
              <ImageIcon className="h-10 w-10 opacity-30" />
              <p className="text-sm">No images yet. Upload one to get started.</p>
              <Button type="button" variant="outline" size="sm" onClick={onUpload} disabled={uploading}>
                <Upload className="h-4 w-4 mr-1.5" /> Upload image
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6">
              {items.map((item) => (
                <button
                  key={item.ulid}
                  type="button"
                  onClick={() => onSelect(item)}
                  className={`relative aspect-square overflow-hidden rounded-md border-2 transition-colors ${
                    selected?.ulid === item.ulid ? 'border-primary' : 'border-transparent hover:border-primary/40'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.thumb_url ?? item.url}
                    alt={item.alt_text ?? item.name}
                    className="h-full w-full object-cover"
                  />
                  {selected?.ulid === item.ulid && (
                    <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                      <Check className="h-5 w-5 text-primary drop-shadow" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {selected && (
          <div className="flex items-center justify-between border-t pt-3">
            <div className="flex flex-col">
              <span className="text-sm font-medium">{selected.name}</span>
              <span className="text-xs text-muted-foreground">
                {selected.width && selected.height ? `${selected.width}×${selected.height} · ` : ''}
                {selected.file_size_kb} KB
              </span>
            </div>
            <Button type="button" onClick={onConfirm}>Use this image</Button>
          </div>
        )}
      </div>
    </DialogContent>
  )
}
