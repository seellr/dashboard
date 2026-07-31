'use client'

import { useState, useMemo } from 'react'
import { z } from 'zod'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'
import { adminFetchClient } from '@/lib/admin/api-client'
import { DataTable } from '@/components/admin/shared/DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'

type CategoryTranslation = { locale: string; name: string }
export type Category = {
  ulid: string
  slug: string
  sort_order: number
  active: boolean
  translations: CategoryTranslation[]
}

const categorySchema = z.object({
  name_ar: z.string().min(1, 'Arabic name is required').max(200),
  name_en: z.string().max(200).optional(),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  sort_order: z.number().int().min(0),
  active: z.boolean(),
})

type CategoryFormValues = z.infer<typeof categorySchema>

const defaultValues: CategoryFormValues = { name_ar: '', name_en: '', slug: '', sort_order: 0, active: true }

function getName(cat: Category, locale: string) {
  return cat.translations.find((t) => t.locale === locale)?.name ?? cat.translations[0]?.name ?? cat.slug
}

interface CategoriesClientProps {
  locale: string
  initialCategories: Category[]
}

export function CategoriesClient({ locale, initialCategories }: CategoriesClientProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues,
  })

  const createMutation = useMutation({
    mutationFn: (data: CategoryFormValues) =>
      adminFetchClient('/categories', {
        method: 'POST',
        body: JSON.stringify({
          brand_id: 1,
          slug: data.slug,
          sort_order: data.sort_order,
          active: data.active,
          translations: [
            { locale: 'ar', name: data.name_ar },
            ...(data.name_en ? [{ locale: 'en', name: data.name_en }] : []),
          ],
        }),
      }),
    onSuccess: (res) => {
      if (!res.ok) { setServerError(res.message); return }
      router.refresh(); closeDialog()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ ulid, data }: { ulid: string; data: CategoryFormValues }) =>
      adminFetchClient(`/categories/${ulid}`, {
        method: 'PUT',
        body: JSON.stringify({
          brand_id: 1,
          slug: data.slug,
          sort_order: data.sort_order,
          active: data.active,
          translations: [
            { locale: 'ar', name: data.name_ar },
            ...(data.name_en ? [{ locale: 'en', name: data.name_en }] : []),
          ],
        }),
      }),
    onSuccess: (res) => {
      if (!res.ok) { setServerError(res.message); return }
      router.refresh(); closeDialog()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (ulid: string) =>
      adminFetchClient(`/categories/${ulid}`, { method: 'DELETE' }),
    onSuccess: () => router.refresh(),
  })

  const columns = useMemo<ColumnDef<Category>[]>(() => [
    {
      accessorFn: (row) => getName(row, locale),
      id: 'name',
      header: 'Name',
      cell: ({ getValue }) => <span className="font-medium">{String(getValue())}</span>,
    },
    {
      accessorKey: 'slug',
      header: 'Slug',
      cell: ({ getValue }) => <span className="font-mono text-xs text-muted-foreground">{String(getValue())}</span>,
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
      accessorKey: 'sort_order',
      header: 'Sort Order',
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
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
  ], [locale, deleteMutation])

  function openCreate() {
    setEditing(null)
    reset(defaultValues)
    setServerError(null)
    setOpen(true)
  }

  function openEdit(cat: Category) {
    setEditing(cat)
    reset({
      name_ar: cat.translations.find((t) => t.locale === 'ar')?.name ?? '',
      name_en: cat.translations.find((t) => t.locale === 'en')?.name ?? '',
      slug: cat.slug,
      sort_order: cat.sort_order,
      active: cat.active,
    })
    setServerError(null)
    setOpen(true)
  }

  function closeDialog() {
    setOpen(false); setEditing(null); reset(defaultValues); setServerError(null)
  }

  async function onSubmit(values: CategoryFormValues) {
    if (editing) {
      await updateMutation.mutateAsync({ ulid: editing.ulid, data: values })
    } else {
      await createMutation.mutateAsync(values)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={openCreate}>+ New Category</Button>
      </div>

      <DataTable
        columns={columns}
        data={initialCategories}
        searchPlaceholder="Search categories…"
      />

      <Dialog open={open} onOpenChange={(v) => { if (!v) closeDialog() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Category' : 'New Category'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-1.5">
                <Label>Name AR *</Label>
                <Input {...register('name_ar')} />
                {errors.name_ar && <p className="text-sm text-destructive">{errors.name_ar.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Name EN</Label>
                <Input {...register('name_en')} />
                {errors.name_en && <p className="text-sm text-destructive">{errors.name_en.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Slug *</Label>
                <Input {...register('slug')} placeholder="my-category" />
                {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Sort Order</Label>
                <Input type="number" {...register('sort_order', { valueAsNumber: true })} />
                {errors.sort_order && <p className="text-sm text-destructive">{errors.sort_order.message}</p>}
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
