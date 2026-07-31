'use client'

import { useRef } from 'react'
import { z } from 'zod'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sileo } from 'sileo'

const brandSchema = z.object({
  primary_color: z.string().max(20).optional(),
  secondary_color: z.string().max(20).optional(),
  bg_color: z.string().max(20).optional(),
  text_color: z.string().max(20).optional(),
  font_heading: z.string().max(100).optional(),
  font_body: z.string().max(100).optional(),
  currency: z.string().length(3, 'Currency must be 3 letters').or(z.literal('')).optional(),
})

type BrandFormValues = z.infer<typeof brandSchema>

interface BrandConfig {
  logo_url: string | null
  favicon_url: string | null
  primary_color: string | null
  secondary_color: string | null
  bg_color: string | null
  text_color: string | null
  font_heading: string | null
  font_body: string | null
  currency: string | null
}

interface Props {
  config: BrandConfig
  brandUlid: string
}

function ColorField({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2 items-center">
        <input
          type="color"
          value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded border"
        />
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="w-36"
        />
      </div>
    </div>
  )
}

export function BrandConfigClient({ config, brandUlid }: Props) {
  const logoRef = useRef<HTMLInputElement>(null)
  const faviconRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<BrandFormValues>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      primary_color: config.primary_color ?? '',
      secondary_color: config.secondary_color ?? '',
      bg_color: config.bg_color ?? '',
      text_color: config.text_color ?? '',
      font_heading: config.font_heading ?? '',
      font_body: config.font_body ?? '',
      currency: config.currency ?? '',
    },
  })

  async function onSubmit(values: BrandFormValues) {
    const locale = typeof document !== 'undefined' ? document.documentElement.lang : 'en'

    const fd = new FormData()
    if (values.primary_color) fd.append('primary_color', values.primary_color)
    if (values.secondary_color) fd.append('secondary_color', values.secondary_color)
    if (values.bg_color) fd.append('bg_color', values.bg_color)
    if (values.text_color) fd.append('text_color', values.text_color)
    if (values.font_heading) fd.append('font_heading', values.font_heading)
    if (values.font_body) fd.append('font_body', values.font_body)
    if (values.currency) fd.append('currency', values.currency)
    const logoFile = logoRef.current?.files?.[0]
    const faviconFile = faviconRef.current?.files?.[0]
    if (logoFile) fd.append('logo', logoFile)
    if (faviconFile) fd.append('favicon', faviconFile)

    try {
      const res = await fetch(`/api/admin/brands/${brandUlid}/config`, {
        method: 'POST',
        headers: { 'x-locale': locale },
        body: fd,
      })
      const json = await res.json().catch(() => null)

      if (!res.ok || !json?.success) {
        sileo.error({ title: json?.message ?? 'Failed to save brand config' })
      } else {
        sileo.success({ title: 'Brand config saved' })
        if (logoRef.current) logoRef.current.value = ''
        if (faviconRef.current) faviconRef.current.value = ''
      }
    } catch {
      sileo.error({ title: 'Network error' })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 max-w-xl">
      <div className="grid grid-cols-2 gap-4">
        <Controller
          control={control}
          name="primary_color"
          render={({ field }) => (
            <ColorField id="primary-color" label="Primary Color" value={field.value ?? ''} onChange={field.onChange} />
          )}
        />
        <Controller
          control={control}
          name="secondary_color"
          render={({ field }) => (
            <ColorField id="secondary-color" label="Secondary Color" value={field.value ?? ''} onChange={field.onChange} />
          )}
        />
        <Controller
          control={control}
          name="bg_color"
          render={({ field }) => (
            <ColorField id="bg-color" label="BG Color" value={field.value ?? ''} onChange={field.onChange} />
          )}
        />
        <Controller
          control={control}
          name="text_color"
          render={({ field }) => (
            <ColorField id="text-color" label="Text Color" value={field.value ?? ''} onChange={field.onChange} />
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="font-heading">Font Heading</Label>
          <Input id="font-heading" placeholder="e.g. Inter" {...register('font_heading')} />
          {errors.font_heading && <p className="text-sm text-destructive">{errors.font_heading.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="font-body">Font Body</Label>
          <Input id="font-body" placeholder="e.g. Inter" {...register('font_body')} />
          {errors.font_body && <p className="text-sm text-destructive">{errors.font_body.message}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-1.5 max-w-[120px]">
        <Label htmlFor="currency">Currency</Label>
        <Input
          id="currency"
          maxLength={3}
          placeholder="SAR"
          {...register('currency')}
        />
        {errors.currency && <p className="text-sm text-destructive">{errors.currency.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Logo</Label>
        {config.logo_url && (
          <img src={config.logo_url} alt="Current logo" className="h-12 object-contain mb-1" />
        )}
        <Input
          ref={logoRef}
          type="file"
          accept="image/*"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Favicon</Label>
        {config.favicon_url && (
          <img src={config.favicon_url} alt="Current favicon" className="h-8 object-contain mb-1" />
        )}
        <Input
          ref={faviconRef}
          type="file"
          accept="image/*"
        />
      </div>

      <div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save Brand Config'}
        </Button>
      </div>
    </form>
  )
}
