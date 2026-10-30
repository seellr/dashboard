'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Image as ImageIcon, UploadCloud, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { MediaLibrary } from './MediaLibrary'
import { MediaUploader } from './MediaUploader'
import type { MediaResource } from '@/types/dto/media.dto'

export interface MediaPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (media: MediaResource | MediaResource[]) => void
  multiple?: boolean
  title?: string
  accept?: string
}

export function MediaPickerDialog({
  open,
  onOpenChange,
  onSelect,
  multiple = false,
  title,
  accept,
}: MediaPickerDialogProps) {
  const t = useTranslations('admin.media')
  const [selectedItems, setSelectedItems] = useState<MediaResource[]>([])
  const [activeTab, setActiveTab] = useState<'library' | 'upload'>('library')

  const handleSelectItem = (item: MediaResource) => {
    if (multiple) {
      setSelectedItems((prev) =>
        prev.some((i) => i.ulid === item.ulid)
          ? prev.filter((i) => i.ulid !== item.ulid)
          : [...prev, item],
      )
    } else {
      setSelectedItems([item])
    }
  }

  const handleConfirm = () => {
    if (selectedItems.length === 0) return
    if (multiple) {
      onSelect(selectedItems)
    } else {
      onSelect(selectedItems[0])
    }
    onOpenChange(false)
    setSelectedItems([])
  }

  const handleUploadSuccess = (uploaded: MediaResource[]) => {
    if (uploaded.length === 0) return
    if (multiple) {
      onSelect(uploaded)
      onOpenChange(false)
    } else {
      onSelect(uploaded[0])
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="pb-3 border-b text-start">
          <DialogTitle className="text-lg font-semibold">
            {title || (multiple ? 'Choose Media Files' : 'Choose Media File')}
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'library' | 'upload')}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="flex items-center justify-between pb-3">
            <TabsList>
              <TabsTrigger value="library" className="gap-1.5 text-xs">
                <ImageIcon className="size-3.5" />
                {t('title')}
              </TabsTrigger>
              <TabsTrigger value="upload" className="gap-1.5 text-xs">
                <UploadCloud className="size-3.5" />
                {t('uploadNew')}
              </TabsTrigger>
            </TabsList>

            {activeTab === 'library' && selectedItems.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {t('selected', { count: selectedItems.length })}
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            <TabsContent value="library" className="mt-0 h-full">
              <MediaLibrary
                selectable
                multipleSelection={multiple}
                selectedUlids={selectedItems.map((i) => i.ulid)}
                onSelectItem={handleSelectItem}
                onToggleSelect={handleSelectItem}
                onUploadClick={() => setActiveTab('upload')}
              />
            </TabsContent>

            <TabsContent value="upload" className="mt-0 p-2">
              <MediaUploader
                multiple={multiple}
                onSuccess={handleUploadSuccess}
              />
            </TabsContent>
          </div>
        </Tabs>

        {activeTab === 'library' && (
          <DialogFooter className="pt-3 border-t flex sm:justify-between items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onOpenChange(false)
                setSelectedItems([])
              }}
            >
              {t('cancel')}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirm}
              disabled={selectedItems.length === 0}
              className="gap-1.5"
            >
              <Check className="size-3.5" />
              Select ({selectedItems.length})
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
