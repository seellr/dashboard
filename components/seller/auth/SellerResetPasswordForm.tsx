'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  useForm,
  useWatch,
  type FieldErrors,
  type Path,
} from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ResetPasswordSchema,
  type ResetPassword,
} from '@/types/dto/subscriber-auth.dto'
import {
  applyAuthFieldErrors,
  resetSellerPassword,
} from '@/lib/seller/auth-client'
import { AuthField } from './AuthField'
import { PasswordChecklist } from './PasswordChecklist'

const RESET_FIELDS = ['password', 'password_confirmation'] as const

export function SellerResetPasswordForm({
  locale,
  token,
  email,
}: {
  locale: string
  token: string
  email: string
}) {
  const t = useTranslations('seller.auth.reset')
  const common = useTranslations('seller.auth.common')
  const validation = useTranslations('seller.auth.validation')
  const [isPending, setIsPending] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [rootError, setRootError] = useState<string | null>(null)

  const form = useForm<ResetPassword>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      token,
      email,
      password: '',
      password_confirmation: '',
    },
  })

  const password = useWatch({ control: form.control, name: 'password' })

  const translateError = (key: string) =>
    validation.has(key) ? validation(key) : key

  async function onSubmit(values: ResetPassword) {
    if (isPending) return
    setIsPending(true)
    setRootError(null)
    form.clearErrors()

    try {
      const result = await resetSellerPassword(values)

      if (result.ok) {
        setIsDone(true)
        return
      }

      if (result.fieldErrors) {
        const applied = applyAuthFieldErrors(
          form,
          result.fieldErrors,
          RESET_FIELDS,
          translateError,
        )
        if (applied) return
      }

      if (result.errorCode === 'auth_reset_token_invalid') {
        setRootError(t('invalidToken'))
        return
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

  function onInvalid(errors: FieldErrors<ResetPassword>) {
    const first = Object.keys(errors)[0] as Path<ResetPassword> | undefined
    if (first) form.setFocus(first)
  }

  const errorFor = (field: 'password' | 'password_confirmation') => {
    const message = form.formState.errors[field]?.message
    return message ? translateError(message) : null
  }

  if (isDone) {
    return (
      <div className="space-y-4 text-center">
        <p className="rounded-lg border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
          {t('success')}
        </p>
        <Link
          href={`/${locale}/seller/login`}
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          {common('goToLogin')}
        </Link>
      </div>
    )
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit, onInvalid)}
      className="flex flex-col gap-4"
      noValidate
    >
      <input type="hidden" {...form.register('token')} />

      {rootError && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {rootError}
        </p>
      )}

      <AuthField id="seller-reset-email" label={common('email')}>
        <Input
          id="seller-reset-email"
          type="email"
          autoComplete="email"
          dir="ltr"
          className="text-start"
          readOnly
          {...form.register('email')}
        />
      </AuthField>

      <AuthField
        id="seller-reset-password"
        label={common('password')}
        error={errorFor('password')}
      >
        <Input
          id="seller-reset-password"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(form.formState.errors.password)}
          {...form.register('password')}
        />
      </AuthField>

      <PasswordChecklist password={password ?? ''} />

      <AuthField
        id="seller-reset-password-confirmation"
        label={common('confirmPassword')}
        error={errorFor('password_confirmation')}
      >
        <Input
          id="seller-reset-password-confirmation"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(form.formState.errors.password_confirmation)}
          {...form.register('password_confirmation')}
        />
      </AuthField>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? t('submit') + '…' : t('submit')}
      </Button>

      <Link
        href={`/${locale}/seller/login`}
        className="text-center text-sm text-primary underline-offset-4 hover:underline"
      >
        {common('backToLogin')}
      </Link>
    </form>
  )
}
