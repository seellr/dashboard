'use client'

import { z } from 'zod'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { adminFetchClient } from '@/lib/admin/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { sileo } from 'sileo'

const vatSchema = z.object({
  vat_rate: z.number({ error: 'Must be a number' }).min(0).max(100),
  vat_label: z.string().min(1, 'Label is required').max(20),
  vat_inclusive: z.boolean(),
  vat_enabled: z.boolean(),
})

type VatFormValues = z.infer<typeof vatSchema>

interface VatConfig {
  vat_rate: number
  vat_label: string
  vat_inclusive: boolean
  vat_enabled: boolean
}

interface Props {
  config: VatConfig
}

export function VatConfigClient({ config }: Props) {
  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<VatFormValues>({
    resolver: zodResolver(vatSchema),
    defaultValues: {
      vat_rate: config.vat_rate,
      vat_label: config.vat_label,
      vat_inclusive: config.vat_inclusive,
      vat_enabled: config.vat_enabled,
    },
  })

  async function onSubmit(values: VatFormValues) {
    const result = await adminFetchClient('/vat-config', {
      method: 'PUT',
      body: JSON.stringify({ brand_id: 1, ...values }),
    })

    if (!result.ok) {
      sileo.error({ title: result.message })
    } else {
      sileo.success({ title: 'VAT config saved' })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 max-w-sm">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="vat-rate">VAT Rate (%)</Label>
        <Input
          id="vat-rate"
          type="number"
          step="0.01"
          min={0}
          max={100}
          {...register('vat_rate', { valueAsNumber: true })}
        />
        {errors.vat_rate && <p className="text-sm text-destructive">{errors.vat_rate.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="vat-label">VAT Label</Label>
        <Input
          id="vat-label"
          placeholder="VAT"
          {...register('vat_label')}
        />
        {errors.vat_label && <p className="text-sm text-destructive">{errors.vat_label.message}</p>}
      </div>

      <div className="flex items-center gap-3">
        <Controller
          control={control}
          name="vat_inclusive"
          render={({ field }) => (
            <Switch id="vat-inclusive" checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
        <Label htmlFor="vat-inclusive">VAT Inclusive</Label>
      </div>

      <div className="flex items-center gap-3">
        <Controller
          control={control}
          name="vat_enabled"
          render={({ field }) => (
            <Switch id="vat-enabled" checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
        <Label htmlFor="vat-enabled">VAT Enabled</Label>
      </div>

      <div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save VAT Config'}
        </Button>
      </div>
    </form>
  )
}
