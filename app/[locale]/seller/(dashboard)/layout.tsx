import { redirect } from 'next/navigation'
import { Toaster } from 'sileo'
import { getImpersonationCookie, getSubscriberToken } from '@/lib/seller/auth'
import { getSellerTenant } from '@/lib/seller/tenant'
import { SellerQueryProvider } from '@/lib/seller/query-provider'
import { SellerShell } from '@/components/seller/layout/SellerShell'

export default async function SellerDashboardLayout({
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
  const impersonation = await getImpersonationCookie()

  if (failure?.status === 401) {
    redirect(`/${locale}/seller/login?expired=1`)
  }

  return (
    <SellerQueryProvider>
      <SellerShell
        locale={locale}
        tenant={tenant}
        impersonation={impersonation}
        tenantError={
          failure
            ? { status: failure.status, errorCode: failure.errorCode }
            : null
        }
      >
        {children}
      </SellerShell>
      <Toaster />
    </SellerQueryProvider>
  )
}
