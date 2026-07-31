import { z } from 'zod'

export const CrmCustomerSchema = z.object({
  ulid: z.string(),
  name: z.string(),
  email: z.string(),
  crm_score: z.number(),
  buyer_type: z.object({ id: z.number(), label: z.string() }).nullable(),
  geo_country: z.string().nullable(),
  created_at: z.string(),
  tags: z.array(z.string()),
})
export type CrmCustomer = z.infer<typeof CrmCustomerSchema>

export interface CrmEvent {
  id: number
  event_type: string
  payload: Record<string, unknown>
  created_at: string
}
