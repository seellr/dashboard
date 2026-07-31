'use client'

import { useState } from 'react'
import { z } from 'zod'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminFetchClient } from '@/lib/admin/api-client'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'

type FunnelTemplate = {
  ulid: string
  name: string
  brand_id: number
  active: boolean
  tripwire_price: string | number | null
  tripwire_product_ulid: string | null
  bump_price: string | number | null
  bump_product_ulid: string | null
  oto_price: string | number | null
  oto_product_ulid: string | null
  downsell_price: string | number | null
  downsell_product_ulid: string | null
  premium_bridge_redirect_url: string | null
  created_at: string
}

const funnelTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  active: z.boolean(),
  oto_price: z.string().optional(),
  oto_product_ulid: z.string().optional(),
  downsell_price: z.string().optional(),
  downsell_product_ulid: z.string().optional(),
  bump_price: z.string().optional(),
  bump_product_ulid: z.string().optional(),
})

type FunnelTemplateFormValues = z.infer<typeof funnelTemplateSchema>

const defaultValues: FunnelTemplateFormValues = {
  name: '',
  active: true,
  oto_price: '',
  oto_product_ulid: '',
  downsell_price: '',
  downsell_product_ulid: '',
  bump_price: '',
  bump_product_ulid: '',
}

function toPayload(f: FunnelTemplateFormValues) {
  return {
    brand_id: 1,
    name: f.name,
    active: f.active,
    oto_price: f.oto_price ? Number(f.oto_price) : null,
    oto_product_ulid: f.oto_product_ulid || null,
    downsell_price: f.downsell_price ? Number(f.downsell_price) : null,
    downsell_product_ulid: f.downsell_product_ulid || null,
    bump_price: f.bump_price ? Number(f.bump_price) : null,
    bump_product_ulid: f.bump_product_ulid || null,
  }
}

export function FunnelTemplatesClient({ locale }: { locale: string }) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<FunnelTemplate | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FunnelTemplateFormValues>({
    resolver: zodResolver(funnelTemplateSchema),
    defaultValues,
  })

  const { data: templates = [], isLoading } = useQuery<FunnelTemplate[]>({
    queryKey: ['admin', 'funnel-templates'],
    queryFn: async () => {
      const res = await adminFetchClient<FunnelTemplate[]>('/funnel-templates?brand_id=1')
      return res.ok ? res.data : []
    },
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'funnel-templates'] })

  const createMutation = useMutation({
    mutationFn: (f: FunnelTemplateFormValues) =>
      adminFetchClient('/funnel-templates', { method: 'POST', body: JSON.stringify(toPayload(f)) }),
    onSuccess: (res) => {
      if (!res.ok) { setServerError(res.message); return }
      closeDialog(); invalidate()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ ulid, f }: { ulid: string; f: FunnelTemplateFormValues }) =>
      adminFetchClient(`/funnel-templates/${ulid}`, { method: 'PUT', body: JSON.stringify(toPayload(f)) }),
    onSuccess: (res) => {
      if (!res.ok) { setServerError(res.message); return }
      closeDialog(); invalidate()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (ulid: string) =>
      adminFetchClient(`/funnel-templates/${ulid}`, { method: 'DELETE' }),
    onSuccess: () => invalidate(),
  })

  function openCreate() {
    setEditing(null); reset(defaultValues); setServerError(null); setOpen(true)
  }

  function openEdit(t: FunnelTemplate) {
    setEditing(t)
    reset({
      name: t.name,
      active: t.active,
      oto_price: t.oto_price != null ? String(t.oto_price) : '',
      oto_product_ulid: t.oto_product_ulid ?? '',
      downsell_price: t.downsell_price != null ? String(t.downsell_price) : '',
      downsell_product_ulid: t.downsell_product_ulid ?? '',
      bump_price: t.bump_price != null ? String(t.bump_price) : '',
      bump_product_ulid: t.bump_product_ulid ?? '',
    })
    setServerError(null); setOpen(true)
  }

  function closeDialog() {
    setOpen(false); setEditing(null); reset(defaultValues); setServerError(null)
  }

  async function onSubmit(values: FunnelTemplateFormValues) {
    if (editing) await updateMutation.mutateAsync({ ulid: editing.ulid, f: values })
    else await createMutation.mutateAsync(values)
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md" />
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={openCreate}>+ New Funnel Template</Button>
      </div>

      {templates.length === 0 ? (
        <p className="text-muted-foreground">No funnel templates yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>OTO Price</TableHead>
              <TableHead>Downsell Price</TableHead>
              <TableHead className="text-end">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((t) => (
              <TableRow key={t.ulid}>
                <TableCell>{t.name}</TableCell>
                <TableCell>
                  <Badge variant={t.active ? 'new' : 'outline'}>
                    {t.active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>{t.oto_price ?? '—'}</TableCell>
                <TableCell>{t.downsell_price ?? '—'}</TableCell>
                <TableCell className="text-end">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(t)}>Edit</Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteMutation.mutate(t.ulid)}
                      disabled={deleteMutation.isPending}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={open} onOpenChange={(v) => { if (!v) closeDialog() }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Funnel Template' : 'New Funnel Template'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-1.5">
                <Label>Name *</Label>
                <Input {...register('name')} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="flex items-center gap-3">
                <Controller
                  control={control}
                  name="active"
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
                <Label>Active</Label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>OTO Price</Label>
                  <Input type="number" {...register('oto_price')} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>OTO Product ULID</Label>
                  <Input {...register('oto_product_ulid')} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Downsell Price</Label>
                  <Input type="number" {...register('downsell_price')} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Downsell Product ULID</Label>
                  <Input {...register('downsell_product_ulid')} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Bump Price</Label>
                  <Input type="number" {...register('bump_price')} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Bump Product ULID</Label>
                  <Input {...register('bump_product_ulid')} />
                </div>
              </div>
              {serverError && <p className="text-sm text-destructive">{serverError}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
