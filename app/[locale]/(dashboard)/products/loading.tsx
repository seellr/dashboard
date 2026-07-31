import { Skeleton } from '@/components/ui/skeleton'

export default function ProductsLoading() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-8 w-48" />
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}
