export interface RevenueAnalytics {
  total_revenue: string
  total_orders: number
  average_order_value: string
  revenue_by_day: Array<{ date: string; revenue: string; orders: number }>
}

export interface ProductPerformance {
  product_ulid: string
  product_name: string
  total_sold: number
  total_revenue: string
}

export interface FunnelPerformance {
  product_ulid: string
  product_name: string
  orders_count: number
  oto_accepted: number
  oto_declined: number
  downsell_accepted: number
  oto_conversion_rate: string
}
