import { adminFetchServer } from '@/lib/admin/api-server'
import { BrandConfigClient } from '@/components/admin/brand/BrandConfigClient'

interface BrandConfig {
  logo_url: string | null
  favicon_url: string | null
  primary_color: string | null
  secondary_color: string | null
  bg_color: string | null
  text_color: string | null
  font_heading: string | null
  font_body: string | null
  currency: string | null
}

const EMPTY_CONFIG: BrandConfig = {
  logo_url: null,
  favicon_url: null,
  primary_color: null,
  secondary_color: null,
  bg_color: null,
  text_color: null,
  font_heading: null,
  font_body: null,
  currency: null,
}

export default async function AdminBrandPage() {
  const brandUlid = '01KVJE5WWN4GCNMSBWGZETYRPJ'
  const result = await adminFetchServer<BrandConfig>(`/admin/brands/${brandUlid}/config`)
  const config = result.ok ? result.data : EMPTY_CONFIG

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Brand Settings</h1>
      <BrandConfigClient config={config} brandUlid={brandUlid} />
    </div>
  )
}
