import { Skeleton } from '@/components/ui/skeleton'

export default function CouponFormLoading() {
  return (
    <div className="flex flex-col gap-4 max-w-xl">
      <Skeleton className="h-8 w-64" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  )
}
