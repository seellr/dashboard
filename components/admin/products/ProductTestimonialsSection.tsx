'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { sileo } from 'sileo'
import { Trash2, Plus, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LangTabs } from '@/components/admin/shared/LangTabs'
import { useProductTestimonials, useAddProductTestimonial, useDeleteProductTestimonial } from '@/hooks/queries/useProducts'

const textAreaClass = 'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y'

export function ProductTestimonialsSection({ ulid }: { ulid: string }) {
  const { data: testimonials = [] } = useProductTestimonials(ulid)
  const addTestimonial = useAddProductTestimonial(ulid)
  const deleteTestimonial = useDeleteProductTestimonial(ulid)
  const [showForm, setShowForm] = useState(false)

  const form = useForm({
    defaultValues: {
      name: '', role: '', avatar_url: '', rating: '', sort_order: '',
      'translations.ar.body': '', 'translations.en.body': '',
    },
  })

  async function onSubmit(values: Record<string, unknown>) {
    const result = await addTestimonial.mutateAsync({
      name: values.name as string | undefined,
      role: (values.role as string) || undefined,
      avatar_url: (values.avatar_url as string) || undefined,
      rating: values.rating ? Number(values.rating) : undefined,
      sort_order: values.sort_order ? Number(values.sort_order) : undefined,
      translations: {
        ar: { body: values['translations.ar.body'] },
        ...(values['translations.en.body'] ? { en: { body: values['translations.en.body'] } } : {}),
      },
    })
    if (!result.ok) {
      sileo.error({ title: 'Could not add testimonial', description: result.message })
      return
    }
    sileo.success({ title: 'Testimonial added' })
    form.reset()
    setShowForm(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {(testimonials as Record<string, unknown>[]).map((t) => (
          <div key={String(t.id)} className="flex items-center justify-between rounded-lg border px-4 py-2">
            <div className="flex flex-col">
              <span className="text-sm font-medium">{String(t.name)}</span>
              <div className="flex items-center gap-1">
                {Boolean(t.rating) && <Star className="size-3 fill-amber-400 text-amber-400" />}
                <span className="text-xs text-muted-foreground">{t.role ? String(t.role) : ''}</span>
              </div>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => deleteTestimonial.mutate(Number(t.id))}>
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>

      {showForm ? (
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3 rounded-lg border p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Name *</label>
              <Input {...form.register('name')} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Role</label>
              <Input {...form.register('role')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Avatar URL</label>
              <Input {...form.register('avatar_url')} placeholder="https://..." />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Rating (1–5)</label>
              <Input type="number" min={1} max={5} step={0.5} {...form.register('rating')} />
            </div>
          </div>
          <LangTabs
            label="Review text"
            ar={
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Review (AR) *</label>
                <textarea {...form.register('translations.ar.body')} dir="rtl" rows={3} required className={textAreaClass} />
              </div>
            }
            en={
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Review (EN)</label>
                <textarea {...form.register('translations.en.body')} dir="ltr" rows={3} className={textAreaClass} />
              </div>
            }
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={addTestimonial.isPending}>
              {addTestimonial.isPending ? '...' : 'Add testimonial'}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      ) : (
        <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setShowForm(true)}>
          <Plus className="size-4" /> Add testimonial
        </Button>
      )}
    </div>
  )
}
