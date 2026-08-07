'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { sileo } from 'sileo'
import { Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LangTabs } from '@/components/admin/shared/LangTabs'
import { useProductFaqs, useAddProductFaq, useDeleteProductFaq } from '@/hooks/queries/useProducts'

const textAreaClass = 'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y'

export function ProductFaqsSection({ ulid }: { ulid: string }) {
  const { data: faqs = [] } = useProductFaqs(ulid)
  const addFaq = useAddProductFaq(ulid)
  const deleteFaq = useDeleteProductFaq(ulid)
  const [showForm, setShowForm] = useState(false)

  const form = useForm({
    defaultValues: {
      'translations.ar.question': '', 'translations.ar.answer': '',
      'translations.en.question': '', 'translations.en.answer': '',
    },
  })

  async function onSubmit(values: Record<string, unknown>) {
    const result = await addFaq.mutateAsync({
      translations: {
        ar: {
          question: values['translations.ar.question'],
          answer: values['translations.ar.answer'],
        },
        ...(values['translations.en.question'] ? {
          en: {
            question: values['translations.en.question'],
            answer: values['translations.en.answer'],
          },
        } : {}),
      },
    })
    if (!result.ok) {
      sileo.error({ title: 'Could not add FAQ', description: result.message })
      return
    }
    sileo.success({ title: 'FAQ added' })
    form.reset()
    setShowForm(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {(faqs as Record<string, unknown>[]).map((faq) => (
          <div key={String(faq.id)} className="flex items-start justify-between rounded-lg border px-4 py-2">
            <span className="text-sm font-medium">{String(faq.question)}</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => deleteFaq.mutate(Number(faq.id))}>
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>

      {showForm ? (
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3 rounded-lg border p-4">
          <LangTabs
            label="FAQ translations"
            ar={
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Question (AR) *</label>
                  <textarea {...form.register('translations.ar.question')} dir="rtl" rows={2} required className={textAreaClass} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Answer (AR) *</label>
                  <textarea {...form.register('translations.ar.answer')} dir="rtl" rows={4} required className={textAreaClass} />
                </div>
              </>
            }
            en={
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Question (EN)</label>
                  <textarea {...form.register('translations.en.question')} dir="ltr" rows={2} className={textAreaClass} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Answer (EN)</label>
                  <textarea {...form.register('translations.en.answer')} dir="ltr" rows={4} className={textAreaClass} />
                </div>
              </>
            }
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={addFaq.isPending}>
              {addFaq.isPending ? '...' : 'Add FAQ'}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      ) : (
        <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setShowForm(true)}>
          <Plus className="size-4" /> Add FAQ
        </Button>
      )}
    </div>
  )
}
