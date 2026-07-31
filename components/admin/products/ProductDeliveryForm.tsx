'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { sileo } from 'sileo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useProductDelivery, useUpsertProductDelivery } from '@/hooks/queries/useProducts'

export function ProductDeliveryForm({ ulid }: { ulid: string }) {
  const { data } = useProductDelivery(ulid)
  const upsert = useUpsertProductDelivery(ulid)

  const form = useForm<Record<string, unknown>>({ defaultValues: { requires_shipping: false } })

  useEffect(() => {
    if (data) form.reset(data as Record<string, unknown>)
  }, [data, form])

  async function onSubmit(values: Record<string, unknown>) {
    const result = await upsert.mutateAsync(values)
    if (!result.ok) {
      sileo.error({ title: 'Could not save delivery config', description: result.message })
      return
    }
    sileo.success({ title: 'Delivery config saved' })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">External URL</label>
        <Input {...form.register('external_url')} placeholder="https://..." />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Notion URL</label>
        <Input {...form.register('notion_url')} placeholder="https://notion.so/..." />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Telegram invite link</label>
        <Input {...form.register('telegram_invite')} placeholder="https://t.me/..." />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Calendly URL</label>
        <Input {...form.register('calendly_url')} placeholder="https://calendly.com/..." />
      </div>

      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Discord</p>
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Server ID</label>
          <Input {...form.register('discord_server_id')} placeholder="123456789" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Role ID</label>
          <Input {...form.register('discord_role_id')} placeholder="123456789" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Bot token</label>
          <Input {...form.register('discord_bot_token')} type="password" placeholder="Bot token" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          checked={Boolean(form.watch('requires_shipping'))}
          onCheckedChange={(v) => form.setValue('requires_shipping', v)}
        />
        <label className="text-sm font-medium">Requires shipping</label>
      </div>

      <Button type="submit" disabled={upsert.isPending} className="self-start">
        {upsert.isPending ? '...' : 'Save delivery'}
      </Button>
    </form>
  )
}
