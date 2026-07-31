'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { sileo } from 'sileo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LangTabs } from '@/components/admin/shared/LangTabs'
import { useProductDescription, useUpsertProductDescription } from '@/hooks/queries/useProducts'

const textAreaClass = 'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y'

const TRANS_FIELDS = [
  { key: 'one_liner', label: 'One-liner' },
  { key: 'target_audience', label: 'Target audience' },
  { key: 'pain_point', label: 'Pain point' },
  { key: 'outcome', label: 'Outcome' },
  { key: 'full_description', label: 'Full description' },
  { key: 'what_you_get', label: 'What you get' },
  { key: 'refund_policy', label: 'Refund policy' },
]

export function ProductDescriptionForm({ ulid }: { ulid: string }) {
  const { data } = useProductDescription(ulid)
  const upsert = useUpsertProductDescription(ulid)

  const form = useForm<Record<string, unknown>>({ defaultValues: {} })

  useEffect(() => {
    if (data) form.reset(data as Record<string, unknown>)
  }, [data, form])

  async function onSubmit(values: Record<string, unknown>) {
    const result = await upsert.mutateAsync(values)
    if (!result.ok) {
      sileo.error({ title: 'Could not save description', description: result.message })
      return
    }
    sileo.success({ title: 'Description saved' })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Difficulty</label>
          <Input {...form.register('difficulty')} placeholder="e.g. Beginner" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Time to value</label>
          <Input {...form.register('time_to_value')} placeholder="e.g. 2 hours" />
        </div>
      </div>

      <LangTabs
        label="Content translations"
        ar={
          <>
            {TRANS_FIELDS.map(({ key, label }) => (
              <div key={key} className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">{label}</label>
                <textarea {...form.register(`translations.ar.${key}`)} dir="rtl" rows={3} className={textAreaClass} />
              </div>
            ))}
          </>
        }
        en={
          <>
            {TRANS_FIELDS.map(({ key, label }) => (
              <div key={key} className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">{label}</label>
                <textarea {...form.register(`translations.en.${key}`)} dir="ltr" rows={3} className={textAreaClass} />
              </div>
            ))}
          </>
        }
      />

      <Button type="submit" disabled={upsert.isPending} className="self-start">
        {upsert.isPending ? '...' : 'Save description'}
      </Button>
    </form>
  )
}
