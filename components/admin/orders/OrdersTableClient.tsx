'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { DataTable } from '@/components/admin/shared/DataTable'
import { useOrdersQuery } from '@/hooks/queries/useOrders'
import type { Order } from '@/types/dto/order.dto'

const STATUS_VALUES = ['Pending', 'Processing', 'Completed', 'Cancelled', 'Refunded']

export function OrdersTableClient({ locale }: { locale: string }) {
  const t = useTranslations('admin.orders')
  const router = useRouter()
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const { data, isLoading, isFetching } = useOrdersQuery(cursor)
  const [allItems, setAllItems] = useState<Order[]>([])
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    if (data?.items) setAllItems(prev => cursor ? [...prev, ...data.items] : data.items)
  }, [data])

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return allItems
    return allItems.filter((o) => o.status.label === statusFilter)
  }, [allItems, statusFilter])

  const columns = useMemo<ColumnDef<Order>[]>(() => [
    {
      accessorKey: 'invoice_number',
      header: t('table.invoice'),
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.invoice_number ?? row.original.ulid.slice(0, 8)}</span>
      ),
    },
    {
      accessorFn: (row) => row.status.label,
      id: 'status',
      header: t('table.status'),
      cell: ({ getValue }) => <Badge className="text-xs">{String(getValue())}</Badge>,
    },
    {
      accessorFn: (row) => Number(row.total),
      id: 'total',
      header: t('table.total'),
      cell: ({ row }) => <span>{row.original.total} {row.original.currency}</span>,
    },
    {
      accessorFn: (row) => row.payment_method.label,
      id: 'payment_method',
      header: t('table.payment'),
      cell: ({ getValue }) => <span className="text-sm text-muted-foreground">{String(getValue())}</span>,
    },
    {
      accessorFn: (row) => new Date(row.created_at).getTime(),
      id: 'created_at',
      header: t('table.date'),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.created_at).toLocaleDateString(locale)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => router.push(`/${locale}/admin/orders/${row.original.ulid}`)}
        >
          View
        </Button>
      ),
    },
  ], [t, locale])

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
        searchPlaceholder={t('table.search') ?? 'Search orders…'}
        toolbar={
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? 'all')}>
            <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUS_VALUES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        }
      />

      {data?.meta?.has_more && (
        <div className="mt-2 flex justify-center">
          <Button variant="outline" size="sm" disabled={isFetching} onClick={() => setCursor(data.meta!.next_cursor!)}>
            {isFetching ? 'Loading…' : 'Load more'}
          </Button>
        </div>
      )}
    </>
  )
}
