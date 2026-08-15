'use client'

import { useCallback, useMemo, useState } from 'react'
import { z } from 'zod'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'
import { adminFetchClient } from '@/lib/admin/api-client'
import { useActiveBrand } from '@/lib/admin/brand-context'
import { ProductPicker } from '@/components/admin/shared/ProductPicker'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'

type TemplateTranslations = {
  tripwire_headline: string | null
  bump_headline: string | null
  bump_description: string | null
  oto_headline: string | null
  downsell_headline: string | null
}

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
  translations: { ar: TemplateTranslations; en: TemplateTranslations } | null
  created_at: string
}

const translationsShape = {
  tripwire_headline: z.string().optional(),
  bump_headline: z.string().optional(),
  bump_description: z.string().optional(),
  oto_headline: z.string().optional(),
  downsell_headline: z.string().optional(),
}

const funnelTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  active: z.boolean(),
  tripwire_price: z.string().optional(),
  tripwire_product_ulid: z.string().optional(),
  oto_price: z.string().optional(),
  oto_product_ulid: z.string().optional(),
  downsell_price: z.string().optional(),
  downsell_product_ulid: z.string().optional(),
  bump_price: z.string().optional(),
  bump_product_ulid: z.string().optional(),
  premium_bridge_redirect_url: z.union([z.literal(''), z.string().url('Enter a valid URL')]).optional(),
  translations: z.object({
    ar: z.object(translationsShape),
    en: z.object(translationsShape),
  }),
})

type FunnelTemplateFormValues = z.infer<typeof funnelTemplateSchema>

const defaultValues: FunnelTemplateFormValues = {
  name: '',
  active: true,
  tripwire_price: '',
  tripwire_product_ulid: '',
  oto_price: '',
  oto_product_ulid: '',
  downsell_price: '',
  downsell_product_ulid: '',
  bump_price: '',
  bump_product_ulid: '',
  premium_bridge_redirect_url: '',
  translations: {
    ar: { tripwire_headline: '', bump_headline: '', bump_description: '', oto_headline: '', downsell_headline: '' },
    en: { tripwire_headline: '', bump_headline: '', bump_description: '', oto_headline: '', downsell_headline: '' },
  },
}

function toPayload(f: FunnelTemplateFormValues, brandId: number) {
  return {
    brand_id: brandId,
    name: f.name,
    active: f.active,
    tripwire_price: f.tripwire_price ? Number(f.tripwire_price) : null,
    tripwire_product_ulid: f.tripwire_product_ulid || null,
    oto_price: f.oto_price ? Number(f.oto_price) : null,
    oto_product_ulid: f.oto_product_ulid || null,
    downsell_price: f.downsell_price ? Number(f.downsell_price) : null,
    downsell_product_ulid: f.downsell_product_ulid || null,
    bump_price: f.bump_price ? Number(f.bump_price) : null,
    bump_product_ulid: f.bump_product_ulid || null,
    premium_bridge_redirect_url: f.premium_bridge_redirect_url || null,
    translations: {
      ar: {
        tripwire_headline: f.translations.ar.tripwire_headline || null,
        bump_headline: f.translations.ar.bump_headline || null,
        bump_description: f.translations.ar.bump_description || null,
        oto_headline: f.translations.ar.oto_headline || null,
        downsell_headline: f.translations.ar.downsell_headline || null,
      },
      en: {
        tripwire_headline: f.translations.en.tripwire_headline || null,
        bump_headline: f.translations.en.bump_headline || null,
        bump_description: f.translations.en.bump_description || null,
        oto_headline: f.translations.en.oto_headline || null,
        downsell_headline: f.translations.en.downsell_headline || null,
      },
    },
  }
}

export function FunnelTemplatesClient({ locale }: { locale: string }) {
  const qc = useQueryClient()
  const { activeBrand } = useActiveBrand()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<FunnelTemplate | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [assigning, setAssigning] = useState<FunnelTemplate | null>(null)
  const [assignProductUlid, setAssignProductUlid] = useState('')
  const [assignError, setAssignError] = useState<string | null>(null)

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FunnelTemplateFormValues>({
    resolver: zodResolver(funnelTemplateSchema),
    defaultValues,
  })

  const { data: templates = [], isLoading } = useQuery<FunnelTemplate[]>({
    queryKey: ['admin', 'funnel-templates'],
    queryFn: async () => {
      const res = await adminFetchClient<FunnelTemplate[]>(`/funnel-templates?brand_id=${activeBrand.id}`)
      return res.ok ? res.data : []
    },
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'funnel-templates'] })

  const createMutation = useMutation({
    mutationFn: (f: FunnelTemplateFormValues) =>
      adminFetchClient('/funnel-templates', { method: 'POST', body: JSON.stringify(toPayload(f, activeBrand.id)) }),
    onSuccess: (res) => {
      if (!res.ok) { setServerError(res.message); return }
      closeDialog(); invalidate()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ ulid, f }: { ulid: string; f: FunnelTemplateFormValues }) =>
      adminFetchClient(`/funnel-templates/${ulid}`, { method: 'PUT', body: JSON.stringify(toPayload(f, activeBrand.id)) }),
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

  const assignMutation = useMutation({
    mutationFn: ({ templateUlid, productUlid }: { templateUlid: string; productUlid: string }) =>
      adminFetchClient(`/funnel-templates/${templateUlid}/assign/${productUlid}`, { method: 'POST' }),
    onSuccess: (res) => {
      if (!res.ok) { setAssignError(res.message); return }
      closeAssign(); invalidate()
    },
  })


  const detachMutation = useMutation({
    mutationFn: (productUlid: string) =>
      adminFetchClient(`/funnel-templates/detach/${productUlid}`, { method: 'DELETE' }),
    onSuccess: (res) => {
      if (!res.ok) return
      invalidate()
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function runDetach(productUlid: string) {
    detachMutation.mutate(productUlid)
  }

  function openCreate() {
    setEditing(null); reset(defaultValues); setServerError(null); setOpen(true)
  }

  const openEdit = useCallback((t: FunnelTemplate) => {
    setEditing(t)
    reset({
      name: t.name,
      active: t.active,
      tripwire_price: t.tripwire_price != null ? String(t.tripwire_price) : '',
      tripwire_product_ulid: t.tripwire_product_ulid ?? '',
      oto_price: t.oto_price != null ? String(t.oto_price) : '',
      oto_product_ulid: t.oto_product_ulid ?? '',
      downsell_price: t.downsell_price != null ? String(t.downsell_price) : '',
      downsell_product_ulid: t.downsell_product_ulid ?? '',
      bump_price: t.bump_price != null ? String(t.bump_price) : '',
      bump_product_ulid: t.bump_product_ulid ?? '',
      premium_bridge_redirect_url: t.premium_bridge_redirect_url ?? '',
      translations: {
        ar: {
          tripwire_headline: t.translations?.ar?.tripwire_headline ?? '',
          bump_headline: t.translations?.ar?.bump_headline ?? '',
          bump_description: t.translations?.ar?.bump_description ?? '',
          oto_headline: t.translations?.ar?.oto_headline ?? '',
          downsell_headline: t.translations?.ar?.downsell_headline ?? '',
        },
        en: {
          tripwire_headline: t.translations?.en?.tripwire_headline ?? '',
          bump_headline: t.translations?.en?.bump_headline ?? '',
          bump_description: t.translations?.en?.bump_description ?? '',
          oto_headline: t.translations?.en?.oto_headline ?? '',
          downsell_headline: t.translations?.en?.downsell_headline ?? '',
        },
      },
    })
    setServerError(null); setOpen(true)
  }, [reset])

  function closeDialog() {
    setOpen(false); setEditing(null); reset(defaultValues); setServerError(null)
  }

  const openAssign = useCallback((t: FunnelTemplate) => {
    setAssigning(t); setAssignProductUlid(''); setAssignError(null)
  }, [])

  function closeAssign() {
    setAssigning(null); setAssignProductUlid(''); setAssignError(null)
  }

  async function onSubmit(values: FunnelTemplateFormValues) {
    if (editing) await updateMutation.mutateAsync({ ulid: editing.ulid, f: values })
    else await createMutation.mutateAsync(values)
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  const columns = useMemo<ColumnDef<FunnelTemplate>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ getValue }) => <span className="font-medium">{String(getValue())}</span>,
    },
    {
      accessorFn: (row) => (row.active ? 'Active' : 'Inactive'),
      id: 'active',
      header: 'Active',
      cell: ({ row }) => (
        <Badge variant={row.original.active ? 'new' : 'outline'}>
          {row.original.active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      accessorKey: 'tripwire_price',
      header: 'Tripwire Price',
      cell: ({ getValue }) => <span>{String(getValue() ?? '—')}</span>,
    },
    {
      accessorKey: 'oto_price',
      header: 'OTO Price',
      cell: ({ getValue }) => <span>{String(getValue() ?? '—')}</span>,
    },
    {
      accessorKey: 'downsell_price',
      header: 'Downsell Price',
      cell: ({ getValue }) => <span>{String(getValue() ?? '—')}</span>,
    },
    {
      accessorKey: 'bump_price',
      header: 'Bump Price',
      cell: ({ getValue }) => <span>{String(getValue() ?? '—')}</span>,
    },
    {
      accessorKey: 'premium_bridge_redirect_url',
      header: 'Premium Bridge URL',
      cell: ({ getValue }) => {
        const value = String(getValue() ?? '')
        return value ? <span className="block max-w-[200px] truncate" title={value}>{value}</span> : <span>—</span>
      },
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => openAssign(row.original)}>Assign</Button>
          <Button size="sm" variant="outline" onClick={() => openEdit(row.original)}>Edit</Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => deleteMutation.mutate(row.original.ulid)}
            disabled={deleteMutation.isPending}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ], [openEdit, openAssign, deleteMutation])

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
        <DataTable
          columns={columns}
          data={templates}
          search={{ placeholder: 'Search funnel templates…' }}
        />
      )}

      <Dialog open={open} onOpenChange={(v) => { if (!v) closeDialog() }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto overscroll-contain">
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
                  <Label>Tripwire Price</Label>
                  <Input type="number" {...register('tripwire_price')} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Tripwire Product ULID</Label>
                  <Input {...register('tripwire_product_ulid')} />
                </div>
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
              <div className="flex flex-col gap-1.5">
                <h2 className="text-sm font-semibold">Premium Bridge</h2>
                <Input type="url" placeholder="https://…" {...register('premium_bridge_redirect_url')} />
                {errors.premium_bridge_redirect_url && (
                  <p className="text-sm text-destructive">{errors.premium_bridge_redirect_url.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-3 border-t pt-4">
                <h2 className="text-sm font-semibold">Translations</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-3">
                    <p className="text-xs font-medium text-muted-foreground">Arabic</p>
                    <div className="flex flex-col gap-1.5">
                      <Label>Tripwire Headline</Label>
                      <Input dir="rtl" {...register('translations.ar.tripwire_headline')} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label>Bump Headline</Label>
                      <Input dir="rtl" {...register('translations.ar.bump_headline')} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label>Bump Description</Label>
                      <Input dir="rtl" {...register('translations.ar.bump_description')} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label>OTO Headline</Label>
                      <Input dir="rtl" {...register('translations.ar.oto_headline')} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label>Downsell Headline</Label>
                      <Input dir="rtl" {...register('translations.ar.downsell_headline')} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <p className="text-xs font-medium text-muted-foreground">English</p>
                    <div className="flex flex-col gap-1.5">
                      <Label>Tripwire Headline</Label>
                      <Input {...register('translations.en.tripwire_headline')} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label>Bump Headline</Label>
                      <Input {...register('translations.en.bump_headline')} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label>Bump Description</Label>
                      <Input {...register('translations.en.bump_description')} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label>OTO Headline</Label>
                      <Input {...register('translations.en.oto_headline')} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label>Downsell Headline</Label>
                      <Input {...register('translations.en.downsell_headline')} />
                    </div>
                  </div>
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

      <Dialog open={assigning !== null} onOpenChange={(v) => { if (!v) closeAssign() }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Template to Product</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label>Product *</Label>
              <ProductPicker value={assignProductUlid || null} onChange={(ulid) => setAssignProductUlid(ulid ?? '')} />
            </div>
            {assignError && <p className="text-sm text-destructive">{assignError}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeAssign}>Cancel</Button>
            <Button
              type="button"
              disabled={!assignProductUlid || assignMutation.isPending}
              onClick={() => assigning && assignMutation.mutate({ templateUlid: assigning.ulid, productUlid: assignProductUlid })}
            >
              {assignMutation.isPending ? 'Assigning…' : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
