import 'server-only'
import { cache } from 'react'
import { sellerFetchServer } from '@/lib/seller/api-server'
import { TenantSchema, type Tenant } from '@/types/dto/tenant.dto'
import { apiFailure, type ApiFailure } from '@/lib/shared/api-result'

export interface SellerTenantResult {
  tenant: Tenant | null
  failure: ApiFailure | null
}

/**
 * Deduped per request: the dashboard layout and the store gate both need the
 * tenant, and React `cache` prevents a second backend call.
 */
export const getSellerTenant = cache(async (): Promise<SellerTenantResult> => {
  const result = await sellerFetchServer<unknown>('/subscriber/tenant')
  console.log(result)
  if (!result.ok) {
    return { tenant: null, failure: result }
  }

  const parsed = TenantSchema.safeParse(result.data)
  if (!parsed.success) {
    console.error('[seller] Invalid tenant response', parsed.error.flatten())
    return {
      tenant: null,
      failure: apiFailure(
        'Invalid tenant response',
        'invalid_response',
        502,
      ),
    }
  }

  return { tenant: parsed.data, failure: null }
})

export function isTenantNotReady(failure: ApiFailure): boolean {
  return failure.status === 409 && failure.errorCode === 'tenant_not_ready'
}

export function isTenantConnectionFailed(failure: ApiFailure): boolean {
  return failure.status === 503 && failure.errorCode === 'tenant_connection_failed'
}
