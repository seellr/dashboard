import { TenantsClient } from '@/components/admin/tenants/TenantsClient'

export default async function AdminTenantsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Tenants</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Provision, suspend, and restore subscriber tenant databases.
        </p>
      </div>
      <TenantsClient />
    </div>
  )
}
