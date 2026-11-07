import { redirect } from 'next/navigation'
import { getSubscriberToken } from '@/lib/seller/auth'
import { getSellerTenant } from '@/lib/seller/tenant'
import { isTenantActive, isTenantProvisioning } from '@/types/dto/tenant.dto'
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

  // if (!tenant || !isTenantActive(tenant)) {
  //   const provisioning =
  //     isTenantProvisioning(tenant) ||
  //     failure?.errorCode === 'tenant_not_ready'
  //   const connectionFailed =
  //     failure?.errorCode === 'tenant_connection_failed' ||
  //     failure?.status === 502

  //   return (
  //     <StoreUnavailable
  //       polling={provisioning && !connectionFailed}
  //       retryable={connectionFailed}
  //       message={
  //         connectionFailed
  //           ? undefined
  //           : failure?.status && failure.status !== 409
  //             ? failure.message
  //             : undefined
  //       }
  //     />
  //   )
  // }

  return <>{children}</>
}
