'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { MediaLibrary } from './MediaLibrary'
import type { SellerMedia } from '@/lib/seller/resource-client'

export function MediaPickerDialog({
  onSelect,
  triggerLabel,
  accept,
  selectedUlid,
}: {
  onSelect: (media: SellerMedia) => void
  triggerLabel?: string
  accept?: string
  selectedUlid?: string | null
}) {
  const t = useTranslations('seller.media')
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<SellerMedia | null>(null)

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="gap-2"
        onClick={() => setOpen(true)}
      >
        <ImageIcon className="size-4" aria-hidden="true" />
        {triggerLabel ?? t('choose')}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{t('pickerTitle')}</DialogTitle>
          <DialogDescription>{t('pickerDescription')}</DialogDescription>
        </DialogHeader>
        <div className="max-h-[65vh] overflow-y-auto pe-1">
          <MediaLibrary
            accept={accept}
            selectionMode
            selectedUlid={selected?.ulid ?? selectedUlid ?? null}
            onSelect={(media) => setSelected(media)}
            compact
          />
        </div>
        <div className="flex justify-end gap-2 border-t pt-3">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            {t('cancel')}
          </Button>
          <Button
            type="button"
            disabled={!selected}
            onClick={() => {
              if (!selected) return
              onSelect(selected)
              setOpen(false)
              setSelected(null)
            }}
          >
            {t('useSelected')}
          </Button>
        </div>
      </DialogContent>
      </Dialog>
    </>
  )
}
