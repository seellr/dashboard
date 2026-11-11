'use client'

import { useRef, useState } from 'react'
import { z } from 'zod'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { sileo } from 'sileo'
import {
  adminOperationsApi,
  type BrandConfigData,
} from '@/lib/admin/operations-client'

const optionalText = (max: number) => z.string().max(max).optional().or(z.literal(''))

const brandSchema = z.object({
  primary_color: optionalText(20),
  secondary_color: optionalText(20),
  bg_color: optionalText(20),
  text_color: optionalText(20),
  font_heading: optionalText(100),
  font_body: optionalText(100),
  currency: z.string().length(3, 'Currency must be 3 letters').or(z.literal('')).optional(),
  country_code: optionalText(10),
  timezone: optionalText(100),
  store_email: z.string().email('Enter a valid email').or(z.literal('')).optional(),
  store_phone: optionalText(50),
  store_address: optionalText(500),
  instagram_url: optionalText(500),
  facebook_url: optionalText(500),
  twitter_url: optionalText(500),
  youtube_url: optionalText(500),
  tiktok_url: optionalText(500),
  snapchat_url: optionalText(500),
  linkedin_url: optionalText(500),
  whatsapp_number: optionalText(50),
  google_analytics_id: optionalText(100),
  facebook_pixel_id: optionalText(100),
})

type BrandFormValues = z.infer<typeof brandSchema>

interface Props {
  config: BrandConfigData
  brandUlid: string
  onSaved: () => void
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
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded border"
          aria-label={label}
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

const FIELD_KEYS = [
  'primary_color',
  'secondary_color',
  'bg_color',
  'text_color',
  'font_heading',
  'font_body',
  'currency',
  'country_code',
  'timezone',
  'store_email',
  'store_phone',
  'store_address',
  'instagram_url',
  'facebook_url',
  'twitter_url',
  'youtube_url',
  'tiktok_url',
  'snapchat_url',
  'linkedin_url',
  'whatsapp_number',
  'google_analytics_id',
  'facebook_pixel_id',
] as const

export function BrandConfigClient({ config, brandUlid, onSaved }: Props) {
  const logoRef = useRef<HTMLInputElement>(null)
  const faviconRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState<'logo' | 'favicon' | null>(null)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<BrandFormValues>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      primary_color: config.primary_color ?? '',
      secondary_color: config.secondary_color ?? '',
      bg_color: config.bg_color ?? '',
      text_color: config.text_color ?? '',
      font_heading: config.font_heading ?? '',
      font_body: config.font_body ?? '',
      currency: config.currency ?? '',
      country_code: config.country_code ?? '',
      timezone: config.timezone ?? '',
      store_email: config.store_email ?? '',
      store_phone: config.store_phone ?? '',
      store_address: config.store_address ?? '',
      instagram_url: config.instagram_url ?? '',
      facebook_url: config.facebook_url ?? '',
      twitter_url: config.twitter_url ?? '',
      youtube_url: config.youtube_url ?? '',
      tiktok_url: config.tiktok_url ?? '',
      snapchat_url: config.snapchat_url ?? '',
      linkedin_url: config.linkedin_url ?? '',
      whatsapp_number: config.whatsapp_number ?? '',
      google_analytics_id: config.google_analytics_id ?? '',
      facebook_pixel_id: config.facebook_pixel_id ?? '',
    },
  })

  async function onSubmit(values: BrandFormValues) {
    const fd = new FormData()
    for (const key of FIELD_KEYS) {
      fd.append(key, values[key] ?? '')
    }

    const result = await adminOperationsApi.updateBrandConfig(brandUlid, fd)
    if (!result.ok) {
      sileo.error({ title: result.message || 'Failed to save brand config' })
      return
    }

    sileo.success({ title: 'Brand config saved' })
    onSaved()
  }

  async function uploadAsset(kind: 'logo' | 'favicon', file: File | undefined) {
    if (!file) return
    setUploading(kind)
    const result =
      kind === 'logo'
        ? await adminOperationsApi.uploadBrandLogo(brandUlid, file)
        : await adminOperationsApi.uploadBrandFavicon(brandUlid, file)
    setUploading(null)

    if (!result.ok) {
      sileo.error({ title: result.message || `Failed to upload ${kind}` })
      return
    }

    if (kind === 'logo' && logoRef.current) logoRef.current.value = ''
    if (kind === 'favicon' && faviconRef.current) faviconRef.current.value = ''
    sileo.success({ title: kind === 'logo' ? 'Logo uploaded' : 'Favicon uploaded' })
    onSaved()
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Logo</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {config.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={config.logo_url} alt="Current logo" className="h-12 object-contain" />
            ) : (
              <p className="text-sm text-muted-foreground">No logo uploaded.</p>
            )}
            <Input ref={logoRef} type="file" accept="image/*" disabled={uploading !== null} onChange={(e) => void uploadAsset('logo', e.target.files?.[0])} />
            {uploading === 'logo' && <p className="text-xs text-muted-foreground">Uploading…</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Favicon</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {config.favicon_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={config.favicon_url} alt="Current favicon" className="h-8 object-contain" />
            ) : (
              <p className="text-sm text-muted-foreground">No favicon uploaded.</p>
            )}
            <Input ref={faviconRef} type="file" accept="image/*" disabled={uploading !== null} onChange={(e) => void uploadAsset('favicon', e.target.files?.[0])} />
            {uploading === 'favicon' && <p className="text-xs text-muted-foreground">Uploading…</p>}
          </CardContent>
        </Card>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Appearance</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Controller control={control} name="primary_color" render={({ field }) => (
                <ColorField id="primary-color" label="Primary color" value={field.value ?? ''} onChange={field.onChange} />
              )} />
              <Controller control={control} name="secondary_color" render={({ field }) => (
                <ColorField id="secondary-color" label="Secondary color" value={field.value ?? ''} onChange={field.onChange} />
              )} />
              <Controller control={control} name="bg_color" render={({ field }) => (
                <ColorField id="bg-color" label="Background color" value={field.value ?? ''} onChange={field.onChange} />
              )} />
              <Controller control={control} name="text_color" render={({ field }) => (
                <ColorField id="text-color" label="Text color" value={field.value ?? ''} onChange={field.onChange} />
              )} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="font-heading">Heading font</Label>
                <Input id="font-heading" placeholder="e.g. Cairo" {...register('font_heading')} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="font-body">Body font</Label>
                <Input id="font-body" placeholder="e.g. Inter" {...register('font_body')} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Store & contact</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="currency">Currency</Label>
                <Input id="currency" maxLength={3} placeholder="EGP" className="uppercase" {...register('currency')} />
                {errors.currency && <p className="text-sm text-destructive">{errors.currency.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="country-code">Country code</Label>
                <Input id="country-code" maxLength={10} placeholder="EG" dir="ltr" {...register('country_code')} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="timezone">Timezone</Label>
                <Input id="timezone" placeholder="Africa/Cairo" dir="ltr" {...register('timezone')} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="store-email">Store email</Label>
                <Input id="store-email" type="email" placeholder="hello@example.com" dir="ltr" {...register('store_email')} />
                {errors.store_email && <p className="text-sm text-destructive">{errors.store_email.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="store-phone">Store phone</Label>
                <Input id="store-phone" placeholder="+201001234567" dir="ltr" {...register('store_phone')} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="store-address">Store address</Label>
              <Textarea id="store-address" rows={2} placeholder="Cairo, Egypt" {...register('store_address')} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Social links</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="instagram">Instagram URL</Label>
              <Input id="instagram" dir="ltr" placeholder="https://instagram.com/…" {...register('instagram_url')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="facebook">Facebook URL</Label>
              <Input id="facebook" dir="ltr" placeholder="https://facebook.com/…" {...register('facebook_url')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="twitter">X / Twitter URL</Label>
              <Input id="twitter" dir="ltr" placeholder="https://x.com/…" {...register('twitter_url')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="youtube">YouTube URL</Label>
              <Input id="youtube" dir="ltr" placeholder="https://youtube.com/…" {...register('youtube_url')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tiktok">TikTok URL</Label>
              <Input id="tiktok" dir="ltr" placeholder="https://tiktok.com/…" {...register('tiktok_url')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="snapchat">Snapchat URL</Label>
              <Input id="snapchat" dir="ltr" placeholder="https://snapchat.com/…" {...register('snapchat_url')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="linkedin">LinkedIn URL</Label>
              <Input id="linkedin" dir="ltr" placeholder="https://linkedin.com/…" {...register('linkedin_url')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="whatsapp">WhatsApp number</Label>
              <Input id="whatsapp" dir="ltr" placeholder="+201001234567" {...register('whatsapp_number')} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Analytics & pixels</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ga-id">Google Analytics ID</Label>
              <Input id="ga-id" dir="ltr" placeholder="G-XXXXXXX" {...register('google_analytics_id')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pixel-id">Facebook Pixel ID</Label>
              <Input id="pixel-id" dir="ltr" placeholder="1234567890" {...register('facebook_pixel_id')} />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save brand config'}
          </Button>
          <Upload className="size-4 text-muted-foreground" aria-hidden="true" />
          <span className="text-xs text-muted-foreground">
            Logo and favicon upload immediately.
          </span>
        </div>
      </form>
    </div>
  )
}
