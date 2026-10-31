'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm, type FieldErrors, type Path } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoginRequestSchema, type LoginRequest } from '@/types/dto/subscriber-auth.dto'
import {
  applyAuthFieldErrors,
  loginSeller,
} from '@/lib/seller/auth-client'
import { sanitizeSellerNext, sellerHome } from '@/lib/seller/next-path'
import { AuthField } from './AuthField'

const LOGIN_FIELDS = ['identifier', 'password'] as const

export function SellerLoginForm({
  locale,
  nextPath,
  initialError,
}: {
  locale: string
  nextPath: string
  initialError?: string
}) {
  const t = useTranslations('seller.auth.login')
  const validation = useTranslations('seller.auth.validation')
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [rootError, setRootError] = useState<string | null>(initialError ?? null)

  const form = useForm<LoginRequest>({
    resolver: zodResolver(LoginRequestSchema),
    defaultValues: { identifier: '', password: '' },
  })

  const translateError = (key: string) =>
    validation.has(key) ? validation(key) : key

  async function onSubmit(values: LoginRequest) {
    if (isPending) return
    setIsPending(true)
    setRootError(null)
    form.clearErrors()

    try {
      const result = await loginSeller(values)

      if (result.ok) {
        router.push(
          sanitizeSellerNext(nextPath, locale, sellerHome(locale)),
        )
        router.refresh()
        return
      }

      if (result.fieldErrors) {
        const applied = applyAuthFieldErrors(
          form,
          result.fieldErrors,
          LOGIN_FIELDS,
          translateError,
        )
        if (applied) return
      }

      if (result.errorCode === 'auth_unavailable') {
        setRootError(t('genericError'))
        return
      }

      if (result.status === 403 && result.errorCode === 'auth_email_not_verified') {
        router.push(`/${locale}/seller/check-email?reason=verify`)
        return
      }

      if (result.errorCode === 'auth_invalid_credentials' || result.status === 401) {
        setRootError(t('invalidCredentials'))
        return
      }

      if (result.errorCode === 'auth_account_inactive') {
        setRootError(result.message ?? t('accountInactive'))
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

  function onInvalid(errors: FieldErrors<LoginRequest>) {
    const first = Object.keys(errors)[0] as Path<LoginRequest> | undefined
    if (first) form.setFocus(first)
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
        id="seller-login-identifier"
        label={t('identifier')}
        error={
          form.formState.errors.identifier?.message
            ? translateError(form.formState.errors.identifier.message)
            : null
        }
      >
        <Input
          id="seller-login-identifier"
          type="text"
          autoComplete="username"
          dir="ltr"
          className="text-start"
          placeholder={t('identifierPlaceholder')}
          aria-invalid={Boolean(form.formState.errors.identifier)}
          {...form.register('identifier')}
        />
      </AuthField>

      <AuthField
        id="seller-login-password"
        label={t('password')}
        error={
          form.formState.errors.password?.message
            ? translateError(form.formState.errors.password.message)
            : null
        }
      >
        <Input
          id="seller-login-password"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(form.formState.errors.password)}
          {...form.register('password')}
        />
      </AuthField>

      <div className="flex justify-end">
        <Link
          href={`/${locale}/seller/forgot-password`}
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          {t('forgot')}
        </Link>
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? t('submit') + '…' : t('submit')}
      </Button>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        <span>{t('google')}</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={isPending}
        onClick={() => {
          window.location.assign(
            `/api/subscriber/auth/google?locale=${encodeURIComponent(locale)}`,
          )
        }}
      >
        {t('google')}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t('noAccount')}{' '}
        <Link
          href={`/${locale}/seller/register`}
          className={buttonVariants({ variant: 'link', size: 'sm' })}
        >
          {t('registerLink')}
        </Link>
      </p>
    </form>
  )
}
