import { BrandSettingsClient } from '@/components/admin/brand/BrandSettingsClient'

export default async function AdminBrandPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Brand Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage the active brand, store details, appearance, social links, and integrations.
        </p>
      </div>
      <BrandSettingsClient />
    </div>
  )
}
