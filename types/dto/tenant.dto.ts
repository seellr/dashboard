import { z } from 'zod'

export const TENANT_STATUS = {
  Active: 1,
  Suspended: 2,
  Provisioning: 3,
  Failed: 4,
} as const

export const TenantStatusSchema = z.object({
  id: z.number(),
  label: z.string(),
})

export const TenantSchema = z.object({
  ulid: z.string(),
  status: TenantStatusSchema,
  name: z.string().nullable().optional(),
  domain: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
})

export type Tenant = z.infer<typeof TenantSchema>
export type TenantStatus = z.infer<typeof TenantStatusSchema>

export function isTenantActive(tenant: Tenant | null | undefined): boolean {
  return tenant?.status.id === TENANT_STATUS.Active
}
