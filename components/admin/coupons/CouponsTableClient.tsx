'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useCouponsQuery } from '@/hooks/queries/useCoupons'
import { DeleteCouponDialogClient } from './DeleteCouponDialogClient'
import { CouponFormClient } from './CouponFormClient'
import type { Coupon } from '@/types/dto/coupon.dto'

export function CouponsTableClient({ locale }: { locale: string }) {
  const t = useTranslations('admin.coupons')
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const { data, isLoading, isFetching } = useCouponsQuery(cursor)
  const [allItems, setAllItems] = useState<Coupon[]>([])
  const [pendingDelete, setPendingDelete] = useState<Coupon | null>(null)
  const [dialogUlid, setDialogUlid] = useState<string | null>(null)

  useEffect(() => {
    if (data?.items) setAllItems(prev => cursor ? [...prev, ...data.items] : data.items)
  }, [data])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md" />
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{allItems.length} {t('title').toLowerCase()}</p>
        <Button size="sm" onClick={() => setDialogUlid('new')}>
          + {t('new')}
        </Button>
      </div>

      {allItems.length === 0 ? (
        <p className="text-muted-foreground">{t('empty')}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('table.code')}</TableHead>
              <TableHead>{t('table.type')}</TableHead>
              <TableHead>{t('table.value')}</TableHead>
              <TableHead>{t('table.uses')}</TableHead>
              <TableHead>{t('table.status')}</TableHead>
              <TableHead className="text-end">{t('table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allItems.map((coupon, i) => (
              <motion.tr
                key={coupon.ulid}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: i * 0.02 }}
                className="border-b"
              >
                <TableCell>{coupon.code}</TableCell>
                <TableCell>{coupon.type.label}</TableCell>
                <TableCell>{coupon.value}</TableCell>
                <TableCell>{coupon.used_count}{coupon.max_uses ? ` / ${coupon.max_uses}` : ''}</TableCell>
                <TableCell>{coupon.active ? '✓' : '—'}</TableCell>
                <TableCell className="text-end">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDialogUlid(coupon.ulid)}
                    >
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setPendingDelete(coupon)}>
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      )}

      {data?.meta?.has_more && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            disabled={isFetching}
            onClick={() => setCursor(data.meta!.next_cursor!)}
          >
            {isFetching ? 'Loading...' : 'Load more'}
          </Button>
        </div>
      )}

      <Dialog open={!!dialogUlid} onOpenChange={(open) => !open && setDialogUlid(null)} disablePointerDismissal>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {dialogUlid === 'new' ? t('new') : t('form.edit')}
            </DialogTitle>
          </DialogHeader>
          {dialogUlid && (
            <CouponFormClient
              locale={locale}
              ulid={dialogUlid}
              onSuccess={() => setDialogUlid(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {pendingDelete && (
        <DeleteCouponDialogClient
          ulid={pendingDelete.ulid}
          open={!!pendingDelete}
          onOpenChange={(open) => !open && setPendingDelete(null)}
        />
      )}
    </>
  )
}
