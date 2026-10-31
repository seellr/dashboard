'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm, type FieldErrors, type Path } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ForgotPasswordSchema,
  type ForgotPassword,
} from '@/types/dto/subscriber-auth.dto'
import {
  applyAuthFieldErrors,
  forgotSellerPassword,
} from '@/lib/seller/auth-client'
import { AuthField } from './AuthField'

const FORGOT_FIELDS = ['email'] as const

export function SellerForgotPasswordForm({ locale }: { locale: string }) {
  const t = useTranslations('seller.auth.forgot')
  const common = useTranslations('seller.auth.common')
  const validation = useTranslations('seller.auth.validation')
  const [isPending, setIsPending] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [rootError, setRootError] = useState<string | null>(null)

  const form = useForm<ForgotPassword>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const translateError = (key: string) =>
    validation.has(key) ? validation(key) : key

  async function onSubmit(values: ForgotPassword) {
    if (isPending) return
    setIsPending(true)
    setRootError(null)
    form.clearErrors()

    try {
      const result = await forgotSellerPassword(values)

      if (result.ok) {
        setIsSent(true)
        return
      }

      if (result.fieldErrors) {
        const applied = applyAuthFieldErrors(
          form,
          result.fieldErrors,
          FORGOT_FIELDS,
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

  function onInvalid(errors: FieldErrors<ForgotPassword>) {
    const first = Object.keys(errors)[0] as Path<ForgotPassword> | undefined
    if (first) form.setFocus(first)
  }

  if (isSent) {
    return (
      <div className="space-y-4 text-center">
        <p className="rounded-lg border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
          {t('neutral')}
        </p>
        <Link
          href={`/${locale}/seller/login`}
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          {t('backToLogin')}
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
      {rootError && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {rootError}
        </p>
      )}

      <AuthField
        id="seller-forgot-email"
        label={common('email')}
        error={
          form.formState.errors.email?.message
            ? translateError(form.formState.errors.email.message)
            : null
        }
      >
        <Input
          id="seller-forgot-email"
          type="email"
          autoComplete="email"
          dir="ltr"
          className="text-start"
          aria-invalid={Boolean(form.formState.errors.email)}
          {...form.register('email')}
        />
      </AuthField>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? t('submit') + '…' : t('submit')}
      </Button>

      <Link
        href={`/${locale}/seller/login`}
        className="text-center text-sm text-primary underline-offset-4 hover:underline"
      >
        {t('backToLogin')}
      </Link>
    </form>
  )
}
