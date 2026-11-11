import { PlansClient } from '@/components/admin/plans/PlansClient'

export default async function AdminPlansPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Subscription plans</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create and manage the plans available to subscribers.
        </p>
      </div>
      <PlansClient />
    </div>
  )
}
