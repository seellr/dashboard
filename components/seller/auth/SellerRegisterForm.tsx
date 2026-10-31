'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  useForm,
  useWatch,
  type FieldErrors,
  type Path,
} from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  RegisterRequestSchema,
  type RegisterRequest,
} from '@/types/dto/subscriber-auth.dto'
import {
  applyAuthFieldErrors,
  registerSeller,
} from '@/lib/seller/auth-client'
import { AuthField } from './AuthField'
import { PasswordChecklist } from './PasswordChecklist'

const REGISTER_FIELDS = [
  'first_name',
  'last_name',
  'email',
  'phone',
  'password',
  'password_confirmation',
] as const

export function SellerRegisterForm({ locale }: { locale: string }) {
  const t = useTranslations('seller.auth.register')
  const validation = useTranslations('seller.auth.validation')
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [rootError, setRootError] = useState<string | null>(null)

  const form = useForm<RegisterRequest>({
    resolver: zodResolver(RegisterRequestSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      password: '',
      password_confirmation: '',
    },
  })

  const password = useWatch({ control: form.control, name: 'password' })

  const translateError = (key: string) =>
    validation.has(key) ? validation(key) : key

  async function onSubmit(values: RegisterRequest) {
    if (isPending) return
    setIsPending(true)
    setRootError(null)
    form.clearErrors()

    try {
      const result = await registerSeller(values)

      if (result.ok) {
        router.push(`/${locale}/seller/check-email?reason=registered`)
        return
      }

      if (result.fieldErrors) {
        const applied = applyAuthFieldErrors(
          form,
          result.fieldErrors,
          REGISTER_FIELDS,
          translateError,
        )
        if (applied) return
      }

      if (result.status === 429 || result.errorCode === 'rate_limit_exceeded') {
        setRootError(t('rateLimited'))
        return
      }

      if (result.status === 0 || result.errorCode === 'network_error') {
        setRootError(t('network'))
        return
      }

      setRootError(t('genericError'))
    } finally {
      setIsPending(false)
    }
  }

  function onInvalid(errors: FieldErrors<RegisterRequest>) {
    const first = Object.keys(errors)[0] as Path<RegisterRequest> | undefined
    if (first) form.setFocus(first)
  }

  const errorFor = (field: keyof RegisterRequest) => {
    const message = form.formState.errors[field]?.message
    return message ? translateError(message) : null
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit, onInvalid)}
      className="flex flex-col gap-4"
      noValidate
    >
      {rootError && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {rootError}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <AuthField
          id="seller-register-first-name"
          label={t('firstName')}
          error={errorFor('first_name')}
        >
          <Input
            id="seller-register-first-name"
            autoComplete="given-name"
            aria-invalid={Boolean(form.formState.errors.first_name)}
            {...form.register('first_name')}
          />
        </AuthField>

        <AuthField
          id="seller-register-last-name"
          label={t('lastName')}
          error={errorFor('last_name')}
        >
          <Input
            id="seller-register-last-name"
            autoComplete="family-name"
            aria-invalid={Boolean(form.formState.errors.last_name)}
            {...form.register('last_name')}
          />
        </AuthField>
      </div>

      <AuthField
        id="seller-register-email"
        label={t('email')}
        error={errorFor('email')}
      >
        <Input
          id="seller-register-email"
          type="email"
          autoComplete="email"
          dir="ltr"
          className="text-start"
          aria-invalid={Boolean(form.formState.errors.email)}
          {...form.register('email')}
        />
      </AuthField>

      <AuthField
        id="seller-register-phone"
        label={t('phone')}
        hint={t('phoneHint')}
        error={errorFor('phone')}
      >
        <Input
          id="seller-register-phone"
          type="tel"
          autoComplete="tel"
          dir="ltr"
          className="text-start"
          placeholder="+201001234567"
          aria-invalid={Boolean(form.formState.errors.phone)}
          {...form.register('phone')}
        />
      </AuthField>

      <AuthField
        id="seller-register-password"
        label={t('password')}
        error={errorFor('password')}
      >
        <Input
          id="seller-register-password"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(form.formState.errors.password)}
          {...form.register('password')}
        />
      </AuthField>

      <PasswordChecklist password={password ?? ''} />

      <AuthField
        id="seller-register-password-confirmation"
        label={t('confirmPassword')}
        error={errorFor('password_confirmation')}
      >
        <Input
          id="seller-register-password-confirmation"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(form.formState.errors.password_confirmation)}
          {...form.register('password_confirmation')}
        />
      </AuthField>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? t('submit') + '…' : t('submit')}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t('haveAccount')}{' '}
        <Link
          href={`/${locale}/seller/login`}
          className={buttonVariants({ variant: 'link', size: 'sm' })}
        >
          {t('loginLink')}
        </Link>
      </p>
    </form>
  )
}
