import { AdminsClient } from '@/components/admin/admins/AdminsClient'

export default async function AdminAdminsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Admins & roles</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage admin accounts, approval status, and role assignments.
        </p>
      </div>
      <AdminsClient />
    </div>
  )
}
