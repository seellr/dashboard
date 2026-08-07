'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminFetchClient } from '@/lib/admin/api-client'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { RevenueAnalytics, ProductPerformance, FunnelPerformance } from '@/types/dto/analytics.dto'

export type { RevenueAnalytics, ProductPerformance, FunnelPerformance }

interface Props {
  initialRevenue: RevenueAnalytics | null
  initialProducts: ProductPerformance[] | null
  initialFunnels: FunnelPerformance[] | null
  defaultDateFrom: string
  defaultDateTo: string
}

export function AnalyticsClient({ initialRevenue, initialProducts, initialFunnels, defaultDateFrom, defaultDateTo }: Props) {
  const [dateFrom, setDateFrom] = useState(defaultDateFrom)
  const [dateTo, setDateTo] = useState(defaultDateTo)
  const [applied, setApplied] = useState({ from: defaultDateFrom, to: defaultDateTo })

  const params = `date_from=${applied.from}&date_to=${applied.to}`

  const { data: revenue, isLoading: loadingRevenue } = useQuery({
    queryKey: ['admin', 'analytics', 'revenue', applied.from, applied.to],
    queryFn: async () => {
      const res = await adminFetchClient<RevenueAnalytics>(`/analytics/revenue?${params}`)
      return res.ok ? res.data : null
    },
    initialData: applied.from === defaultDateFrom && applied.to === defaultDateTo ? (initialRevenue ?? undefined) : undefined,
  })

  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ['admin', 'analytics', 'products', applied.from, applied.to],
    queryFn: async () => {
      const res = await adminFetchClient<ProductPerformance[]>(`/analytics/product-performance?${params}`)
      return res.ok ? res.data : []
    },
    initialData: applied.from === defaultDateFrom && applied.to === defaultDateTo ? (initialProducts ?? undefined) : undefined,
  })

  const { data: funnels, isLoading: loadingFunnels } = useQuery({
    queryKey: ['admin', 'analytics', 'funnels', applied.from, applied.to],
    queryFn: async () => {
      const res = await adminFetchClient<FunnelPerformance[]>(`/analytics/funnel-performance?${params}`)
      return res.ok ? res.data : []
    },
    initialData: applied.from === defaultDateFrom && applied.to === defaultDateTo ? (initialFunnels ?? undefined) : undefined,
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="date-from">From</Label>
          <Input id="date-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="date-to">To</Label>
          <Input id="date-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
        </div>
        <Button variant="outline" size="sm" onClick={() => setApplied({ from: dateFrom, to: dateTo })}>
          Apply
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Total Revenue', value: revenue?.total_revenue },
          { label: 'Total Orders', value: revenue?.total_orders?.toString() },
          { label: 'Avg Order Value', value: revenue?.average_order_value },
        ].map(({ label, value }) => (
          <Card key={label} className="flex flex-col gap-1 p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
            {loadingRevenue ? (
              <Skeleton className="h-7 w-28" />
            ) : (
              <p className="text-2xl font-bold">{value ?? '—'}</p>
            )}
          </Card>
        ))}
      </div>

      <Card className="flex flex-col gap-4 p-5">
        <p className="text-base font-semibold">Product Performance</p>
        {loadingProducts ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Units Sold</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(products ?? []).map((p) => (
                <TableRow key={p.product_ulid}>
                  <TableCell>{p.product_name}</TableCell>
                  <TableCell className="text-right">{p.total_sold}</TableCell>
                  <TableCell className="text-right">{p.total_revenue}</TableCell>
                </TableRow>
              ))}
              {!(products ?? []).length && (
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No data</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card className="flex flex-col gap-4 p-5">
        <p className="text-base font-semibold">Funnel Performance</p>
        {loadingFunnels ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">OTO Accepted</TableHead>
                <TableHead className="text-right">Conversion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(funnels ?? []).map((f) => (
                <TableRow key={f.product_ulid}>
                  <TableCell>{f.product_name}</TableCell>
                  <TableCell className="text-right">{f.orders_count}</TableCell>
                  <TableCell className="text-right">{f.oto_accepted}</TableCell>
                  <TableCell className="text-right">{f.oto_conversion_rate}%</TableCell>
                </TableRow>
              ))}
              {!(funnels ?? []).length && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No data</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
