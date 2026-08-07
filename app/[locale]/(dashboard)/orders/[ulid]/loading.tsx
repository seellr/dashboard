import { Skeleton } from '@/components/ui/skeleton'

export default function OrderDetailLoading() {
  return (
    <div className="flex flex-col gap-4 max-w-xl">
      <Skeleton className="h-8 w-64" />
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-6 w-full" />
      ))}
    </div>
  )
}
