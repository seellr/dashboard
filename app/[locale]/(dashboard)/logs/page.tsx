import { AuditLogsClient } from '@/components/admin/logs/AuditLogsClient'

export default async function AdminLogsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Audit & activity logs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Super-admin view of security audit events and model activity.
        </p>
      </div>
      <AuditLogsClient />
    </div>
  )
}
