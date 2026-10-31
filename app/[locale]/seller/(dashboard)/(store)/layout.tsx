import { redirect } from 'next/navigation'
import { getSubscriberToken } from '@/lib/seller/auth'
import { getSellerTenant } from '@/lib/seller/tenant'
import { isTenantActive } from '@/types/dto/tenant.dto'
import { StoreUnavailable } from '@/components/seller/layout/StoreUnavailable'

export default async function SellerStoreLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const token = await getSubscriberToken()

  if (!token) {
    redirect(`/${locale}/seller/login`)
  }

  const { tenant, failure } = await getSellerTenant()

  if (failure?.status === 401) {
    redirect(`/${locale}/seller/login?expired=1`)
  }
  console.log(tenant)
  console.log(isTenantActive(tenant))
  // if (!tenant || !isTenantActive(tenant)) {
  //   return <StoreUnavailable polling={tenant?.status.id === 3 || failure?.errorCode === 'tenant_not_ready'} />
  // }

  return <>{children}</>
}
