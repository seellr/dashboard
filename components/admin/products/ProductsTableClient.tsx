'use client'

import { useState, useEffect, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { DataTable } from '@/components/admin/shared/DataTable'
import { useProductsQuery } from '@/hooks/queries/useProducts'
import { DeleteProductDialogClient } from './DeleteProductDialogClient'
import { ProductSlidePanel } from './ProductSlidePanel'
import type { Product } from '@/types/dto/product.dto'
import { ProductTypeLabels } from '@/types/dto/product.dto'

const STATUS_VALUES = ['Draft', 'Published', 'Archived', 'Coming Soon', 'Waitlist']

export function ProductsTableClient({ locale }: { locale: string }) {
  const t = useTranslations('admin.products')
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const { data, isLoading, isFetching } = useProductsQuery(cursor)
  const [allItems, setAllItems] = useState<Product[]>([])
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null)
  const [editUlid, setEditUlid] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  useEffect(() => {
    if (data?.items) setAllItems(prev => cursor ? [...prev, ...data.items] : data.items)
  }, [data])

  const filtered = useMemo(() => {
    return allItems.filter((p) => {
      if (statusFilter !== 'all' && p.status?.label !== statusFilter) return false
      if (typeFilter !== 'all' && p.type.label !== typeFilter) return false
      return true
    })
  }, [allItems, statusFilter, typeFilter])

  const uniqueTypes = useMemo(() => [...new Set(allItems.map((p) => p.type.label))], [allItems])

  const columns = useMemo<ColumnDef<Product>[]>(() => [
    {
      id: 'image',
      header: '',
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        row.original.hero_image_url
          ? <img src={row.original.hero_image_url} alt="" className="h-8 w-8 rounded object-cover" />
          : <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">—</div>
      ),
    },
    {
      accessorKey: 'name',
      header: t('table.name'),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{row.original.name || row.original.internal_name}</span>
          <span className="text-xs text-muted-foreground">{row.original.sku}</span>
        </div>
      ),
    },
    {
      accessorFn: (row) => row.type.label,
      id: 'type',
      header: t('table.type'),
      cell: ({ getValue }) => <Badge variant="outline" className="text-xs">{String(getValue())}</Badge>,
    },
    {
      accessorFn: (row) => Number(row.base_price),
      id: 'price',
      header: t('table.price'),
      cell: ({ row }) => <span className="text-sm">{row.original.base_price} {row.original.currency}</span>,
    },
    {
      accessorFn: (row) => row.status?.label ?? '',
      id: 'status',
      header: t('table.status'),
      cell: ({ getValue }) => {
        const v = String(getValue())
        return v ? <Badge className="text-xs">{v}</Badge> : <span className="text-muted-foreground">—</span>
      },
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => setEditUlid(row.original.ulid)}>
            {t('table.edit')}
          </Button>
          <Button size="sm" variant="destructive" onClick={() => setPendingDelete(row.original)}>
            {t('table.delete')}
          </Button>
        </div>
      ),
    },
  ], [t])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
      </div>
    )
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={filtered}
        searchPlaceholder={t('table.search') ?? 'Search products…'}
        toolbar={
          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? 'all')}>
              <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {uniqueTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? 'all')}>
              <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUS_VALUES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        }
      />

      {data?.meta?.has_more && (
        <div className="mt-2 flex justify-center">
          <Button variant="outline" size="sm" disabled={isFetching} onClick={() => setCursor(data.meta!.next_cursor!)}>
            {isFetching ? 'Loading…' : 'Load more'}
          </Button>
        </div>
      )}

      <ProductSlidePanel
        ulid={editUlid}
        open={!!editUlid}
        onOpenChange={(open) => !open && setEditUlid(null)}
        locale={locale}
      />

      {pendingDelete && (
        <DeleteProductDialogClient
          ulid={pendingDelete.ulid}
          open={!!pendingDelete}
          onOpenChange={(open) => !open && setPendingDelete(null)}
        />
      )}
    </>
  )
}
