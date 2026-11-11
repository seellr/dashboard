import { ShippingMethodsClient } from '@/components/admin/shipping/ShippingMethodsClient'

export default async function AdminShippingPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Shipping</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage the custom shipping methods shown at checkout.
        </p>
      </div>
      <ShippingMethodsClient />
    </div>
  )
}
