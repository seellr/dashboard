'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ProductFormClient } from './ProductFormClient'
import { ProductDescriptionForm } from './ProductDescriptionForm'
import { ProductSeoForm } from './ProductSeoForm'
import { ProductDeliveryForm } from './ProductDeliveryForm'
import { ProductAssetsSection } from './ProductAssetsSection'
import { ProductTestimonialsSection } from './ProductTestimonialsSection'
import { ProductFaqsSection } from './ProductFaqsSection'
import { FunnelConfigFormClient } from './FunnelConfigFormClient'
import { Skeleton } from '@/components/ui/skeleton'
import { useProductQuery } from '@/hooks/queries/useProducts'
import { useFunnelConfigQuery } from '@/hooks/queries/useFunnelConfig'

interface ProductSlidePanelProps {
  ulid: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  locale: string
}

const TAB_IDS_NEW = ['basic']
const TAB_IDS_EDIT = ['basic', 'description', 'seo', 'delivery', 'assets', 'testimonials', 'faqs', 'funnel']

function PanelContent({ ulid, locale, onClose }: { ulid: string; locale: string; onClose: () => void }) {
  const isNew = ulid === 'new'
  const { data: product, isLoading: productLoading } = useProductQuery(ulid)
  const { data: funnelConfig } = useFunnelConfigQuery(ulid)
  const t = useTranslations('admin')
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('basic')

  const tabIds = isNew ? TAB_IDS_NEW : TAB_IDS_EDIT
  const tabs = tabIds.map((id) => ({ id, label: t(`tab.${id}`) }))

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
    onClose()
  }

  return (
    <>
      <DialogHeader className="border-b pb-4">
        <DialogTitle>{isNew ? t('products.new') : (product?.name ?? '…')}</DialogTitle>
      </DialogHeader>

      {!isNew && (
        <div className="flex gap-1 overflow-x-auto border-b py-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div className="py-6">
        {activeTab === 'basic' && (
          !isNew && productLoading
            ? <div className="flex flex-col gap-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            : <ProductFormClient
              locale={locale}
              existing={isNew ? null : (product ?? null)}
              onSuccess={handleSuccess}
            />
        )}
        {!isNew && activeTab === 'description' && <ProductDescriptionForm ulid={ulid} />}
        {!isNew && activeTab === 'seo' && <ProductSeoForm ulid={ulid} />}
        {!isNew && activeTab === 'delivery' && <ProductDeliveryForm ulid={ulid} />}
        {!isNew && activeTab === 'assets' && <ProductAssetsSection ulid={ulid} />}
        {!isNew && activeTab === 'testimonials' && <ProductTestimonialsSection ulid={ulid} />}
        {!isNew && activeTab === 'faqs' && <ProductFaqsSection ulid={ulid} />}
        {!isNew && activeTab === 'funnel' && (
          <FunnelConfigFormClient productUlid={ulid} existing={funnelConfig ?? null} />
        )}
      </div>
    </>
  )
}

export function ProductSlidePanel({ ulid, open, onOpenChange, locale }: ProductSlidePanelProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-full max-w-2xl sm:max-w-2xl overflow-y-auto p-6">
        {ulid && open && (
          <PanelContent ulid={ulid} locale={locale} onClose={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  )
}
