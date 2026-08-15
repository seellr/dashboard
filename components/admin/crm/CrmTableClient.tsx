'use client'

import { useMemo } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import type { CrmCustomer } from '@/types/dto/crm.dto'

export type { CrmCustomer }

interface Props {
  initialCustomers: CrmCustomer[] | null
}

export function CrmTableClient({ initialCustomers }: Props) {
  const columns = useMemo<ColumnDef<CrmCustomer>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ getValue }) => <span className="font-medium">{String(getValue())}</span>,
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ getValue }) => <span className="text-muted-foreground text-sm">{String(getValue())}</span>,
    },
    {
      accessorKey: 'crm_score',
      header: 'Score',
      cell: ({ getValue }) => <span className="text-right block">{String(getValue())}</span>,
    },
    {
      accessorFn: (row) => row.buyer_type?.label ?? '',
      id: 'buyer_type',
      header: 'Buyer Type',
      cell: ({ row }) => {
        const label = row.original.buyer_type?.label
        if (!label) return <span className="text-muted-foreground">—</span>
        const cls: Record<string, string> = {
          Cold: 'bg-gray-100 text-gray-700',
          Warm: 'bg-yellow-100 text-yellow-800',
          Hot: 'bg-red-100 text-red-700',
          VIP: 'bg-purple-100 text-purple-800',
        }
        return <Badge className={cls[label] ?? ''}>{label}</Badge>
      },
    },
    {
      accessorFn: (row) => row.tags.join(', '),
      id: 'tags',
      header: 'Tags',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
          ))}
        </div>
      ),
    },
    {
      accessorKey: 'geo_country',
      header: 'Country',
      cell: ({ getValue }) => <span>{String(getValue() ?? '—')}</span>,
    },
    {
      accessorFn: (row) => new Date(row.created_at).getTime(),
      id: 'joined',
      header: 'Joined',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.created_at).toLocaleDateString()}
        </span>
      ),
    },
  ], [])

  return (
    <DataTable
      columns={columns}
      data={initialCustomers ?? []}
      search={{ placeholder: 'Search by name or email…' }}
    />
  )
}
