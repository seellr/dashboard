'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { UploadCloud, Image as ImageIcon, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MediaLibrary } from './MediaLibrary'
import { MediaUploader } from './MediaUploader'
import { MediaDetailsSheet } from './MediaDetailsSheet'
import type { MediaResource } from '@/types/dto/media.dto'

export function MediaLibraryClient() {
  const t = useTranslations('admin.media')
  const [activeTab, setActiveTab] = useState<'library' | 'upload'>('library')
  const [activeMedia, setActiveMedia] = useState<MediaResource | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleOpenDetails = (item: MediaResource) => {
    setActiveMedia(item)
    setSheetOpen(true)
  }

  const handleUploadSuccess = () => {
    // Switch back to library view after upload
    setActiveTab('library')
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="flex flex-col gap-5 w-full">
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as 'library' | 'upload')}
        className="flex flex-col gap-4"
      >
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="library" className="gap-2 text-xs font-medium">
              <ImageIcon className="size-3.5" />
              {t('title')}
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2 text-xs font-medium">
              <UploadCloud className="size-3.5" />
              {t('uploadNew')}
            </TabsTrigger>
          </TabsList>

          {activeTab === 'library' && (
            <Button
              type="button"
              size="sm"
              onClick={() => setActiveTab('upload')}
              className="gap-1.5"
            >
              <Plus className="size-4" />
              {t('uploadNew')}
            </Button>
          )}
        </div>

        <TabsContent value="library" className="mt-0">
          <MediaLibrary
            key={refreshKey}
            selectable
            multipleSelection
            onOpenDetails={handleOpenDetails}
            onUploadClick={() => setActiveTab('upload')}
          />
        </TabsContent>

        <TabsContent value="upload" className="mt-0">
          <div className="rounded-xl border bg-card p-6 shadow-xs max-w-3xl">
            <MediaUploader
              multiple
              onSuccess={handleUploadSuccess}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Details Sheet for viewing and editing item metadata */}
      <MediaDetailsSheet
        media={activeMedia}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onDeleted={() => {
          setActiveMedia(null)
          setRefreshKey((prev) => prev + 1)
        }}
        onUpdated={(updated) => {
          setActiveMedia(updated)
          setRefreshKey((prev) => prev + 1)
        }}
      />
    </div>
  )
}
