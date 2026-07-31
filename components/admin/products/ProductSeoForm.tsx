'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { sileo } from 'sileo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LangTabs } from '@/components/admin/shared/LangTabs'
import { useProductSeo, useUpsertProductSeo } from '@/hooks/queries/useProducts'

const textAreaClass = 'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y'

export function ProductSeoForm({ ulid }: { ulid: string }) {
  const { data } = useProductSeo(ulid)
  const upsert = useUpsertProductSeo(ulid)

  const form = useForm<Record<string, unknown>>({ defaultValues: {} })

  useEffect(() => {
    if (data) form.reset(data as Record<string, unknown>)
  }, [data, form])

  async function onSubmit(values: Record<string, unknown>) {
    const result = await upsert.mutateAsync(values)
    if (!result.ok) {
      sileo.error({ title: 'Could not save SEO', description: result.message })
      return
    }
    sileo.success({ title: 'SEO saved' })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">OG image URL</label>
        <Input {...form.register('og_image_url')} placeholder="https://..." />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Canonical URL</label>
        <Input {...form.register('canonical_url')} placeholder="https://..." />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Schema type</label>
        <Input {...form.register('schema_type')} placeholder="Product" />
      </div>

      <LangTabs
        label="Meta translations"
        ar={
          <>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Meta title (AR)</label>
              <Input {...form.register('translations.ar.meta_title')} dir="rtl" maxLength={160} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Meta description (AR)</label>
              <textarea {...form.register('translations.ar.meta_description')} dir="rtl" rows={3} maxLength={320} className={textAreaClass} />
            </div>
          </>
        }
        en={
          <>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Meta title (EN)</label>
              <Input {...form.register('translations.en.meta_title')} dir="ltr" maxLength={160} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Meta description (EN)</label>
              <textarea {...form.register('translations.en.meta_description')} dir="ltr" rows={3} maxLength={320} className={textAreaClass} />
            </div>
          </>
        }
      />

      <Button type="submit" disabled={upsert.isPending} className="self-start">
        {upsert.isPending ? '...' : 'Save SEO'}
      </Button>
    </form>
  )
}
