import { adminFetchServer } from '@/lib/admin/api-server'
import { VatConfigClient } from '@/components/admin/vat/VatConfigClient'

interface VatConfig {
  vat_rate: number
  vat_label: string
  vat_inclusive: boolean
  vat_enabled: boolean
}

export default async function AdminVatPage() {
  const result = await adminFetchServer<VatConfig>('/admin/vat-config?brand_id=1')

  const config: VatConfig = result.ok
    ? result.data
    : { vat_rate: 0, vat_label: 'VAT', vat_inclusive: false, vat_enabled: false }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">VAT Config</h1>
      <VatConfigClient config={config} />
    </div>
  )
}
