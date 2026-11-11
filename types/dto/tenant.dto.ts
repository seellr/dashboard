import { z } from 'zod'

// Documented tenant status ids: 1=Provisioning, 2=Active, 3=Suspended.
// `Failed` is the remaining state used by the tenant lifecycle.
export const TENANT_STATUS = {
  Provisioning: 1,
  Active: 2,
  Suspended: 3,
  Failed: 4,
} as const

const TENANT_STATUS_LABELS: Record<number, string> = {
  [TENANT_STATUS.Active]: 'Active',
  [TENANT_STATUS.Suspended]: 'Suspended',
  [TENANT_STATUS.Provisioning]: 'Provisioning',
  [TENANT_STATUS.Failed]: 'Failed',
}

export const TenantStatusSchema = z.preprocess(
  (value) => {
    if (typeof value === 'number') {
      return { id: value, label: TENANT_STATUS_LABELS[value] ?? String(value) }
    }
    return value
  },
  z.object({
    id: z.number(),
    label: z.string(),
  }),
)

export const TenantSchema = z.preprocess(
  (value) => {
    if (typeof value === 'string') return { ulid: value }
    return value
  },
  z.object({
    ulid: z.string(),
    status: TenantStatusSchema,
    subscriber_id: z.number().nullish(),
    db_name: z.string().nullish(),
    provision_error: z.string().nullish(),
    provisioned_at: z.string().nullish(),
    suspended_at: z.string().nullish(),
    name: z.string().nullish(),
    domain: z.string().nullish(),
    created_at: z.string().nullish(),
  }),
)

export type Tenant = z.infer<typeof TenantSchema>
export type TenantStatus = z.infer<typeof TenantStatusSchema>

export function isTenantActive(tenant: Tenant | null | undefined): boolean {
  return tenant?.status.id === TENANT_STATUS.Active
}

export function isTenantProvisioning(
  tenant: Tenant | null | undefined,
): boolean {
  return tenant?.status.id === TENANT_STATUS.Provisioning
}
