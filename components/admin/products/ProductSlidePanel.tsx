'use client'

import { ProductWizardDialog } from './ProductWizardDialog'

interface ProductSlidePanelProps {
  ulid: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  locale: string
}

export function ProductSlidePanel({ ulid, open, onOpenChange }: ProductSlidePanelProps) {
  return (
    <ProductWizardDialog
      ulid={ulid}
      open={open}
      onOpenChange={onOpenChange}
    />
  )
}
