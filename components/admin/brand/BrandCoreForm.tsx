'use client'

import { z } from 'zod'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { sileo } from 'sileo'
import { adminOperationsApi, type BrandRecord } from '@/lib/admin/operations-client'

const brandCoreSchema = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(120)
    .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers and hyphens only'),
  domain: z.string().max(255).optional().or(z.literal('')),
  active: z.boolean(),
})

type BrandCoreValues = z.infer<typeof brandCoreSchema>

export function BrandCoreForm({
  brand,
  onSaved,
}: {
  brand: BrandRecord
  onSaved: () => void
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<BrandCoreValues>({
    resolver: zodResolver(brandCoreSchema),
    defaultValues: {
      name: brand.name ?? '',
      slug: brand.slug ?? '',
      domain: brand.domain ?? '',
      active: brand.active ?? true,
    },
  })

  async function onSubmit(values: BrandCoreValues) {
    const result = await adminOperationsApi.updateBrand(brand.ulid, {
      name: values.name,
      slug: values.slug,
      domain: values.domain?.trim() || null,
      active: values.active,
    })

    if (!result.ok) {
      sileo.error({ title: result.message || 'Could not update brand' })
      return
    }

    sileo.success({ title: 'Brand updated' })
    onSaved()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex max-w-2xl flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="brand-name">Brand name</Label>
          <Input id="brand-name" {...register('name')} />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="brand-slug">Slug</Label>
          <Input id="brand-slug" dir="ltr" {...register('slug')} />
          {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="brand-domain">Custom domain</Label>
        <Input id="brand-domain" dir="ltr" placeholder="shop.example.com" {...register('domain')} />
        {errors.domain && <p className="text-sm text-destructive">{errors.domain.message}</p>}
      </div>

      <div className="flex items-center gap-3">
        <Controller
          control={control}
          name="active"
          render={({ field }) => (
            <Switch id="brand-active" checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
        <Label htmlFor="brand-active">Brand is active</Label>
      </div>

      <div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save brand'}
        </Button>
      </div>
    </form>
  )
}
