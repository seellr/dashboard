'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { sileo } from 'sileo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AdminLoginRequestSchema, type AdminLoginRequest } from '@/types/dto/auth.dto'

export function LoginFormClient({ locale }: { locale: string }) {
  const t = useTranslations('admin')
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  const form = useForm<AdminLoginRequest>({
    resolver: zodResolver(AdminLoginRequestSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: AdminLoginRequest) {
    setIsPending(true)
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-locale': locale },
        body: JSON.stringify(values),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        sileo.error({ title: t('login.error') })
        return
      }
      router.push(`/${locale}`)
      router.refresh()
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 w-full max-w-sm">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">{t('login.email')}</label>
        <Input id="email" type="email" {...form.register('email')} />
        {form.formState.errors.email && (
          <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium">{t('login.password')}</label>
        <Input id="password" type="password" {...form.register('password')} />
        {form.formState.errors.password && (
          <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
        )}
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? '...' : t('login.submit')}
      </Button>
    </form>
  )
}
