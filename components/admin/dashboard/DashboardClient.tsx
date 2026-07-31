'use client'

import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  Area, AreaChart, CartesianGrid, XAxis, YAxis,
  Pie, PieChart, Cell,
} from 'recharts'
import { TrendingUp, ShoppingCart, CreditCard, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import type { RevenueAnalytics, ProductPerformance, FunnelPerformance } from '@/types/dto/analytics.dto'
import type { CrmCustomer } from '@/types/dto/crm.dto'
import type { Order } from '@/types/dto/order.dto'
import { SectionCards } from '@/components/section-cards'

interface DashboardClientProps {
  revenue: RevenueAnalytics | null
  recentOrders: Order[]
  productPerf: ProductPerformance[]
  funnelPerf: FunnelPerformance[]
  recentCustomers: CrmCustomer[]
  locale: string
}

const revenueChartConfig: ChartConfig = {
  revenue: { label: 'Revenue', color: 'hsl(var(--chart-1))' },
  orders: { label: 'Orders', color: 'hsl(var(--chart-2))' },
}

const BUYER_TYPE_COLORS: Record<string, string> = {
  Cold: 'hsl(var(--chart-3))',
  Warm: 'hsl(var(--chart-4))',
  Hot: 'hsl(var(--chart-5))',
  VIP: 'hsl(var(--chart-1))',
}

function KpiCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number | undefined }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 p-5">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon className="h-4 w-4" />
          <p className="text-xs font-medium uppercase tracking-wide">{label}</p>
        </div>
        <p className="text-2xl font-bold">{value ?? '—'}</p>
      </CardContent>
    </Card>
  )
}

export function DashboardClient({
  revenue,
  recentOrders,
  productPerf,
  funnelPerf,
  recentCustomers,
  locale,
}: DashboardClientProps) {
  const router = useRouter()

  const revenueByDay = (revenue?.revenue_by_day ?? []).map((d) => ({
    date: d.date,
    revenue: parseFloat(d.revenue),
    orders: d.orders,
  }))

  const buyerTypeCounts: Record<string, number> = {}
  for (const c of recentCustomers) {
    const label = c.buyer_type?.label ?? 'Unknown'
    buyerTypeCounts[label] = (buyerTypeCounts[label] ?? 0) + 1
  }
  const pieData = Object.entries(buyerTypeCounts).map(([name, value]) => ({ name, value }))

  const pieConfig: ChartConfig = Object.fromEntries(
    pieData.map(({ name }) => [name, { label: name, color: BUYER_TYPE_COLORS[name] ?? 'hsl(var(--chart-2))' }])
  )

  return (
    <div className="flex flex-col gap-6">
      <SectionCards />
      {/* <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div> */}
      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard icon={TrendingUp} label="Total Revenue" value={revenue?.total_revenue} />
        <KpiCard icon={ShoppingCart} label="Total Orders" value={revenue?.total_orders} />
        <KpiCard icon={CreditCard} label="Avg Order Value" value={revenue?.average_order_value} />
        <KpiCard icon={Users} label="Recent Customers" value={recentCustomers.length} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue Area Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Revenue (30d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={revenueChartConfig} className="h-[260px] w-full">
              <AreaChart data={revenueByDay} margin={{ left: 12, right: 12 }}>
                <defs>
                  <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: string) => { try { return format(new Date(v), 'MMM dd') } catch { return v } }}
                />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="revenue" stroke="var(--color-revenue)" fill="url(#fillRevenue)" strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Top Products</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Sold</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productPerf.slice(0, 5).map((p) => (
                  <TableRow key={p.product_ulid}>
                    <TableCell className="text-sm">{p.product_name}</TableCell>
                    <TableCell className="text-right text-sm">{p.total_sold}</TableCell>
                    <TableCell className="text-right text-sm">{p.total_revenue}</TableCell>
                  </TableRow>
                ))}
                {productPerf.length === 0 && (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground text-sm py-6">No data</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.slice(0, 5).map((order) => (
                  <TableRow key={order.ulid} className="cursor-pointer" onClick={() => router.push(`/${locale}/orders/${order.ulid}`)}>
                    <TableCell className="text-sm font-mono">{order.invoice_number ?? order.ulid.slice(-6)}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{order.status.label}</Badge></TableCell>
                    <TableCell className="text-right text-sm">{order.total} {order.currency}</TableCell>
                    <TableCell className="text-sm">{new Date(order.created_at).toLocaleDateString(locale)}</TableCell>
                  </TableRow>
                ))}
                {recentOrders.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground text-sm py-6">No orders</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Buyer Type Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Buyer Type Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ChartContainer config={pieConfig} className="h-[220px] w-full">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={BUYER_TYPE_COLORS[entry.name] ?? 'hsl(var(--chart-2))'} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                  <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                </PieChart>
              </ChartContainer>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">No customer data</p>
            )}
          </CardContent>
        </Card>

        {/* Funnel Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Funnel Performance</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">OTO</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {funnelPerf.slice(0, 5).map((f) => (
                  <TableRow key={f.product_ulid}>
                    <TableCell className="text-sm">{f.product_name}</TableCell>
                    <TableCell className="text-right text-sm">{f.orders_count}</TableCell>
                    <TableCell className="text-right text-sm">{f.oto_accepted}</TableCell>
                    <TableCell className="text-right text-sm">{f.oto_conversion_rate}%</TableCell>
                  </TableRow>
                ))}
                {funnelPerf.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground text-sm py-6">No data</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Customers */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Recent Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {recentCustomers.slice(0, 5).map((c) => (
                <div key={c.ulid} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.buyer_type && <Badge variant="outline" className="text-xs">{c.buyer_type.label}</Badge>}
                    <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString(locale)}</span>
                  </div>
                </div>
              ))}
              {recentCustomers.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">No customers</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
