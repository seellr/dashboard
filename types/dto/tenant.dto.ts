import { z } from 'zod'

export const TENANT_STATUS = {
  Active: 1,
  Suspended: 2,
  Provisioning: 3,
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
