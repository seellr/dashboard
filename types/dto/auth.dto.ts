import { z } from 'zod'

export const AdminLoginRequestSchema = z.object({
  email: z.string().email().max(180),
  password: z.string().min(8).max(128),
})
export type AdminLoginRequest = z.infer<typeof AdminLoginRequestSchema>

export const AdminSchema = z.object({
  ulid: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string(),
  is_super_admin: z.boolean(),
  status: z.number(),
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
  created_at: z.string().nullable().optional(),
})
export type Admin = z.infer<typeof AdminSchema>

export const AdminLoginResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
  user: AdminSchema,
})
export type AdminLoginResponse = z.infer<typeof AdminLoginResponseSchema>
