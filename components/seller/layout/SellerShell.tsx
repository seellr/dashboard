'use client'

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { SellerHeader } from './SellerHeader'
import { SellerSidebar } from './SellerSidebar'
import { TenantBanner, type TenantErrorState } from './TenantBanner'
import { ImpersonationBanner } from './ImpersonationBanner'
import type { Tenant } from '@/types/dto/tenant.dto'

export function SellerShell({
  locale,
  tenant,
  tenantError,
  impersonation,
  children,
}: {
  locale: string
  tenant: Tenant | null
  tenantError: TenantErrorState | null
  impersonation: { session_ulid: string; name: string } | null
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <SellerSidebar locale={locale} storeName={tenant?.name ?? null} />
      <SidebarInset>
        <SellerHeader locale={locale} tenant={tenant} />
        {impersonation && (
          <ImpersonationBanner name={impersonation.name} locale={locale} />
        )}
        <TenantBanner tenant={tenant} error={tenantError} />
        <main className="flex flex-1 flex-col gap-4 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
