'use client'

import { useState } from 'react'
import { Image as ImageIcon, X, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MediaPickerDialog } from './MediaPickerDialog'
import type { MediaResource } from '@/types/dto/media.dto'

export interface MediaPickerProps {
  value?: string | null
  onChange: (url: string, item: MediaResource) => void
  onClear?: () => void
  label?: string
  accept?: string
}

export function MediaPicker({
  value,
  onChange,
  onClear,
  label = 'Choose image',
  accept = 'image/*',
}: MediaPickerProps) {
  const [open, setOpen] = useState(false)

  const handleSelect = (selected: MediaResource | MediaResource[]) => {
    const item = Array.isArray(selected) ? selected[0] : selected
    if (item) {
      onChange(item.url, item)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {value ? (
        <div className="relative w-full max-w-xs group rounded-xl overflow-hidden border bg-muted/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt=""
            className="h-36 w-full object-cover transition-transform group-hover:scale-102"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setOpen(true)}
              className="text-xs shadow-xs"
            >
              Change
            </Button>
            {onClear && (
              <Button
                type="button"
                variant="destructive"
                size="icon-sm"
                onClick={onClear}
                title="Remove image"
                aria-label="Remove image"
                className="shadow-xs"
              >
                <X className="size-3.5" />
              </Button>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-xl border-border hover:border-primary/60 hover:bg-muted/30 transition-all text-center max-w-xs cursor-pointer group"
        >
          <div className="size-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
            <ImageIcon className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <span className="text-xs font-medium text-foreground">{label}</span>
        </button>
      )}

      <MediaPickerDialog
        open={open}
        onOpenChange={setOpen}
        onSelect={handleSelect}
        multiple={false}
        title={label}
        accept={accept}
      />
    </div>
  )
}
