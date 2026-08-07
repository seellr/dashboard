import { getTranslations } from 'next-intl/server'
import { adminFetchServer } from '@/lib/admin/api-server'
import { CrmTableClient } from '@/components/admin/crm/CrmTableClient'
import type { CrmCustomer } from '@/components/admin/crm/CrmTableClient'

export default async function AdminCrmPage() {
  const t = await getTranslations('admin')

  const result = await adminFetchServer<CrmCustomer[]>('/admin/crm/customers?brand_id=1')
  const initialCustomers = result.ok ? result.data : null

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">{t('nav.crm')}</h1>
      <CrmTableClient initialCustomers={initialCustomers} />
    </div>
  )
}
