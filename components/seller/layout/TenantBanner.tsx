'use client'

import { AlertTriangle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { isTenantActive, TENANT_STATUS, type Tenant } from '@/types/dto/tenant.dto'
import { cn } from '@/lib/utils'

export interface TenantErrorState {
  status: number
  errorCode: string
}

const STATUS_KEY: Record<number, string> = {
  [TENANT_STATUS.Suspended]: 'suspended',
  [TENANT_STATUS.Provisioning]: 'provisioning',
  [TENANT_STATUS.Failed]: 'failed',
}

export function TenantBanner({
  tenant,
  error,
}: {
  tenant: Tenant | null
  error: TenantErrorState | null
}) {
  const t = useTranslations('seller.tenant')

  if (isTenantActive(tenant)) return null
  if (!tenant && !error) return null

  let message = t('unavailable')
  if (error?.status === 409 && error.errorCode === 'tenant_not_ready') {
    message = t('notReady')
  } else if (error?.status === 503 && error.errorCode === 'tenant_connection_failed') {
    message = t('connectionFailed')
  } else if (tenant) {
    const key = STATUS_KEY[tenant.status.id]
    message = key ? t(key) : tenant.status.label
  }

  return (
    <div
      role="status"
      className={cn(
        'flex items-start gap-2 border-b px-6 py-3 text-sm',
        'border-amber-300/60 bg-amber-50 text-amber-950',
        'dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100',
      )}
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div>
        <p className="font-medium">{t('title')}</p>
        <p className="text-xs opacity-90">{message}</p>
      </div>
    </div>
  )
}
