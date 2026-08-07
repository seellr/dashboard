'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { sileo } from 'sileo'
import { Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useProductAssets, useAddProductAsset, useDeleteProductAsset } from '@/hooks/queries/useProducts'

const ASSET_TYPES = [
  { value: '1', label: 'File' },
  { value: '2', label: 'Link' },
  { value: '3', label: 'Notion URL' },
  { value: '4', label: 'Prompt Item' },
]

export function ProductAssetsSection({ ulid }: { ulid: string }) {
  const { data: assets = [] } = useProductAssets(ulid)
  const addAsset = useAddProductAsset(ulid)
  const deleteAsset = useDeleteProductAsset(ulid)
  const [showForm, setShowForm] = useState(false)

  const form = useForm({
    defaultValues: { name: '', asset_type: '1', url: '', file_size_bytes: '', prompt_text: '', prompt_category: '' },
  })

  async function onSubmit(values: Record<string, unknown>) {
    const result = await addAsset.mutateAsync({
      ...values,
      asset_type: Number(values.asset_type),
      file_size_bytes: values.file_size_bytes ? Number(values.file_size_bytes) : undefined,
    })
    if (!result.ok) {
      sileo.error({ title: 'Could not add asset', description: result.message })
      return
    }
    sileo.success({ title: 'Asset added' })
    form.reset()
    setShowForm(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {(assets as Record<string, unknown>[]).map((asset) => (
          <div key={String(asset.id)} className="flex items-center justify-between rounded-lg border px-4 py-2">
            <div className="flex flex-col">
              <span className="text-sm font-medium">{String(asset.name)}</span>
              <span className="text-xs text-muted-foreground">{String((asset.asset_type as Record<string, unknown>)?.label ?? '')}</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => deleteAsset.mutate(Number(asset.id))}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>

      {showForm ? (
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3 rounded-lg border p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Name</label>
              <Input {...form.register('name')} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Type</label>
              <Select
                value={form.watch('asset_type') ?? '1'}
                onValueChange={(v: string | null) => form.setValue('asset_type', (v ?? '1') as never)}
              >
                <SelectTrigger className="w-full"><SelectValue>{(v: string | null) => v ? (ASSET_TYPES.find((t) => t.value === v)?.label ?? v) : 'Select type'}</SelectValue></SelectTrigger>
                <SelectContent>
                  {ASSET_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">URL</label>
            <Input {...form.register('url')} placeholder="https://..." required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">File size (bytes)</label>
              <Input type="number" {...form.register('file_size_bytes')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Prompt category</label>
              <Input {...form.register('prompt_category')} />
            </div>
          </div>
          {form.watch('asset_type') === '4' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Prompt text</label>
              <textarea
                {...form.register('prompt_text')}
                rows={3}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
              />
            </div>
          )}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={addAsset.isPending}>
              {addAsset.isPending ? '...' : 'Add asset'}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      ) : (
        <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setShowForm(true)}>
          <Plus className="size-4" /> Add asset
        </Button>
      )}
    </div>
  )
}
