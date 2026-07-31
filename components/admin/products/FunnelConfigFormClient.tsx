'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { sileo } from 'sileo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UpsertFunnelConfigSchema, type UpsertFunnelConfigInput, type FunnelConfig } from '@/types/dto/funnel.dto'
import { useUpsertFunnelConfig } from '@/hooks/queries/useFunnelConfig'
import { ProductPicker } from '@/components/admin/shared/ProductPicker'

export function FunnelConfigFormClient({ productUlid, existing }: { productUlid: string; existing: FunnelConfig | null }) {
  const t = useTranslations('admin.funnel')
  const upsert = useUpsertFunnelConfig(productUlid)

  const form = useForm<UpsertFunnelConfigInput>({
    resolver: zodResolver(UpsertFunnelConfigSchema),
    defaultValues: {
      tripwire_ulid: existing?.tripwire?.product_ulid ?? null,
      tripwire_price: toNumber(existing?.tripwire?.price),
      bump_ulid: existing?.bump?.product_ulid ?? null,
      bump_price: toNumber(existing?.bump?.price),
      oto_ulid: existing?.oto?.product_ulid ?? null,
      oto_price: toNumber(existing?.oto?.price),
      oto_original_price: toNumber(existing?.oto?.original_price),
      oto_timer_minutes: existing?.oto?.timer_minutes ?? null,
      downsell_ulid: existing?.downsell?.product_ulid ?? null,
      downsell_price: toNumber(existing?.downsell?.price),
      premium_bridge_ulid: existing?.premium_bridge?.product_ulid ?? null,
      premium_score_threshold: existing?.premium_bridge?.score_threshold ?? null,
      translations: {
        ar: {
          tripwire_headline: existing?.tripwire?.headline ?? null,
          bump_headline: existing?.bump?.headline ?? null,
          bump_description: existing?.bump?.description ?? null,
          oto_headline: existing?.oto?.headline ?? null,
          downsell_headline: existing?.downsell?.headline ?? null,
        },
      },
    },
  })

  async function onSubmit(values: UpsertFunnelConfigInput) {
    const result = await upsert.mutateAsync(values)
    if (!result.ok) {
      sileo.error({ title: t('saveError'), description: result.message })
      return
    }
    sileo.success({ title: t('saveSuccess') })
  }

  function pickerField(name: 'tripwire_ulid' | 'bump_ulid' | 'oto_ulid' | 'downsell_ulid' | 'premium_bridge_ulid') {
    return (
      <Controller
        control={form.control}
        name={name}
        render={({ field }) => (
          <ProductPicker value={field.value ?? null} onChange={field.onChange} />
        )}
      />
    )
  }

  function numberField(
    name: 'tripwire_price' | 'bump_price' | 'oto_price' | 'oto_original_price' | 'oto_timer_minutes' | 'downsell_price' | 'premium_score_threshold',
    label: string,
  ) {
    return (
      <Input
        type="number"
        step="0.01"
        placeholder={label}
        {...form.register(name, { setValueAs: (v) => (v === '' ? null : Number(v)) })}
      />
    )
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6 max-w-2xl">
      <div className="flex flex-col gap-2 border-b pb-4">
        <h2 className="text-sm font-semibold">{t('tripwire')}</h2>
        {pickerField('tripwire_ulid')}
        {numberField('tripwire_price', t('price'))}
        <Input placeholder={t('headline')} {...form.register('translations.ar.tripwire_headline')} dir="rtl" />
      </div>

      <div className="flex flex-col gap-2 border-b pb-4">
        <h2 className="text-sm font-semibold">{t('bump')}</h2>
        {pickerField('bump_ulid')}
        {numberField('bump_price', t('price'))}
        <Input placeholder={t('headline')} {...form.register('translations.ar.bump_headline')} dir="rtl" />
      </div>

      <div className="flex flex-col gap-2 border-b pb-4">
        <h2 className="text-sm font-semibold">{t('oto')}</h2>
        {pickerField('oto_ulid')}
        <div className="flex gap-2">
          {numberField('oto_price', t('price'))}
          {numberField('oto_original_price', t('originalPrice'))}
          {numberField('oto_timer_minutes', t('timerMinutes'))}
        </div>
        <Input placeholder={t('headline')} {...form.register('translations.ar.oto_headline')} dir="rtl" />
      </div>

      <div className="flex flex-col gap-2 border-b pb-4">
        <h2 className="text-sm font-semibold">{t('downsell')}</h2>
        {pickerField('downsell_ulid')}
        {numberField('downsell_price', t('price'))}
        <Input placeholder={t('headline')} {...form.register('translations.ar.downsell_headline')} dir="rtl" />
      </div>

      <div className="flex flex-col gap-2 border-b pb-4">
        <h2 className="text-sm font-semibold">{t('premiumBridge')}</h2>
        {pickerField('premium_bridge_ulid')}
        {numberField('premium_score_threshold', t('scoreThreshold'))}
      </div>

      <Button type="submit" disabled={upsert.isPending} className="self-start">
        {upsert.isPending ? '…' : t('save')}
      </Button>
    </form>
  )
}

function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null
  const n = Number(value)
  return Number.isNaN(n) ? null : n
}
