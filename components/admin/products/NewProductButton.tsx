'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { ProductSlidePanel } from './ProductSlidePanel'

export function NewProductButton({ locale }: { locale: string }) {
  const t = useTranslations('admin.products')
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>{t('new')}</Button>
      <ProductSlidePanel ulid="new" open={open} onOpenChange={setOpen} locale={locale} />
    </>
  )
}
