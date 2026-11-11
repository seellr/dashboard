import { DomainsClient } from '@/components/admin/domains/DomainsClient'

export default async function AdminDomainsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Domains</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cross-subscriber view of custom domains and verification status.
        </p>
      </div>
      <DomainsClient />
    </div>
  )
}
