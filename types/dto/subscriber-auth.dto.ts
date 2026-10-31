import { z } from 'zod'

const NAME_REGEX = /^[\p{L}\s\-'.]+$/u
const PHONE_REGEX = /^\+[1-9][0-9]{6,14}$/
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const nameSchema = (message: string) =>
  z.string({ error: 'required' })
    .min(2, message)
    .max(100, message)
    .regex(NAME_REGEX, message)

const emailSchema = (max: number) =>
  z.string({ error: 'required' })
    .min(1, 'required')
    .max(max, 'email_too_long')
    .regex(EMAIL_REGEX, 'email_invalid')

const passwordSchema = z.string({ error: 'required' })
  .min(8, 'password_length')
  .max(128, 'password_length')
  .regex(PASSWORD_REGEX, 'password_weak')

export const SubscriberUserSchema = z.object({
  ulid: z.string().length(26),
  first_name: z.string().nullish(),
  last_name: z.string().nullish(),
  phone: z.string().nullish(),
  email: z.string().nullish(),
  email_verified: z.boolean().optional().default(false),
  avatar_url: z.string().nullish(),
  plan_status: z
    .union([
      z.literal(1), z.literal(2), z.literal(3), z.literal(4),
      z.object({ id: z.number(), label: z.string() }),
    ])
    .nullish(),
  trial_ends_at: z.string().nullish(),
  subscription_ends_at: z.string().nullish(),
  roles: z.array(z.unknown()).optional().default([]),
  created_at: z.string().nullish(),
})

export type SubscriberUser = z.infer<typeof SubscriberUserSchema>

export const LoginRequestSchema = z.object({
  identifier: z.string({ error: 'required' }).min(1, 'required').max(255, 'identifier_too_long'),
  password: z.string({ error: 'required' }).min(8, 'password_length').max(128, 'password_length'),
})

export type LoginRequest = z.infer<typeof LoginRequestSchema>

export const LoginResponseSchema = z.object({
  access_token: z.string({ error: 'required' }).min(1),
  token_type: z.literal('Bearer'),
  expires_in: z.number().int().positive(),
  user: SubscriberUserSchema,
})

export type LoginResponse = z.infer<typeof LoginResponseSchema>

export const MeResponseSchema = z.union([
  SubscriberUserSchema,
  z.object({ user: SubscriberUserSchema }),
])

export const RegisterRequestSchema = z
  .object({
    first_name: nameSchema('name_invalid'),
    last_name: nameSchema('name_invalid'),
    email: emailSchema(255),
    phone: z.string({ error: 'required' })
      .min(1, 'required')
      .max(16, 'phone_invalid')
      .regex(PHONE_REGEX, 'phone_invalid'),
    password: passwordSchema,
    password_confirmation: z.string({ error: 'required' }).min(1, 'required'),
  })
  .superRefine((values, ctx) => {
    if (values.password !== values.password_confirmation) {
      ctx.addIssue({
        code: 'custom',
        path: ['password_confirmation'],
        message: 'password_mismatch',
      })
    }
  })

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>

export const ForgotPasswordSchema = z.object({
  email: emailSchema(180),
})

export type ForgotPassword = z.infer<typeof ForgotPasswordSchema>

export const ResetPasswordSchema = z
  .object({
    token: z.string({ error: 'required' }).min(1, 'required').max(128, 'token_too_long'),
    email: emailSchema(255),
    password: passwordSchema,
    password_confirmation: z.string({ error: 'required' }).min(1, 'required'),
  })
  .superRefine((values, ctx) => {
    if (values.password !== values.password_confirmation) {
      ctx.addIssue({
        code: 'custom',
        path: ['password_confirmation'],
        message: 'password_mismatch',
      })
    }
  })

export type ResetPassword = z.infer<typeof ResetPasswordSchema>

export const VerifyEmailQuerySchema = z.object({
  ulid: z.string({ error: 'required' }).min(1, 'required').max(64, 'invalid_link'),
  hash: z.string({ error: 'required' }).min(1, 'required').max(255, 'invalid_link'),
})

export type VerifyEmailQuery = z.infer<typeof VerifyEmailQuerySchema>

export const AuthSuccessSchema = z.object({
  success: z.literal(true),
  message: z.string({ error: 'required' }).optional(),
  data: z.unknown().optional(),
})

export const AuthErrorEnvelopeSchema = z.object({
  success: z.literal(false),
  message: z.string({ error: 'required' }).optional(),
  error_code: z.string({ error: 'required' }).optional(),
  errors: z.record(z.string({ error: 'required' }), z.array(z.string({ error: 'required' }))).nullable().optional(),
})

export type AuthFieldErrors = Record<string, string[]>
