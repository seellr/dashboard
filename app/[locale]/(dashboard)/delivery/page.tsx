import { DeliveryAccessClient } from '@/components/admin/delivery/DeliveryAccessClient'

export default async function AdminDeliveryPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Delivery access</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Inspect, grant, and revoke customer delivery access for digital products.
        </p>
      </div>
      <DeliveryAccessClient />
    </div>
  )
}
