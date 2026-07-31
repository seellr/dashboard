'use client'

import { useTranslations } from 'next-intl'
import { sileo } from 'sileo'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useDeleteProduct } from '@/hooks/queries/useProducts'

export function DeleteProductDialogClient({
  ulid, open, onOpenChange,
}: {
  ulid: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useTranslations('admin.products.form')
  const deleteProduct = useDeleteProduct()

  async function handleConfirm() {
    const result = await deleteProduct.mutateAsync(ulid)
    if (!result.ok) {
      sileo.error({ title: t('deleteError') })
      return
    }
    sileo.success({ title: t('deleteSuccess') })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('deleteConfirmTitle')}</DialogTitle>
          <DialogDescription>{t('deleteConfirmBody')}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline">{t('deleteCancel')}</Button>} />
          <Button variant="destructive" onClick={handleConfirm} disabled={deleteProduct.isPending}>
            {deleteProduct.isPending ? '...' : t('deleteConfirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
