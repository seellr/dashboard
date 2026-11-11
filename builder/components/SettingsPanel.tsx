'use client'

import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { HexColorPicker } from 'react-colorful'
import { ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { MediaPickerDialog } from '@/components/shared/MediaPickerDialog'
import type { SettingDefinition } from '@/shared/types/builder'
import { buildSettingsSchema, flattenSettings, mergeSettings, settingFieldName } from '@/builder/lib/settings-form'
import { useEditorStore } from '@/builder/store/editor-store'
import { listSellerProducts, type SellerProduct } from '@/lib/seller/resource-client'
import { RichTextEditor } from '@/builder/components/RichTextEditor'
import { resolveMediaUrl } from '@/shared/lib/media-url'

type FormValues = Record<string, unknown>

function useSellerProducts() {
  return useQuery({
    queryKey: ['builder-seller-products'],
    queryFn: async (): Promise<SellerProduct[]> => {
      const result = await listSellerProducts('?per_page=100')
      return result.ok ? result.data.items : []
    },
    staleTime: 60_000,
  })
}

export function SettingsPanel() {
  const section = useEditorStore((state) => state.page.sections.find((item) => item.id === state.selectedSectionId))
  const schema = useEditorStore((state) => state.schema)
  const localeTab = useEditorStore((state) => state.localeTab)
  const setLocaleTab = useEditorStore((state) => state.setLocaleTab)
  const update = useEditorStore((state) => state.updateSectionSettings)
  const [mediaField, setMediaField] = useState<string | null>(null)
  const { data: products = [] } = useSellerProducts()

  const definitionList = useMemo<SettingDefinition[]>(
    () => schema.sections.find((item) => item.handle === section?.type)?.settings ?? [],
    [schema.sections, section?.type],
  )
  const definition = useMemo(
    () => schema.sections.find((item) => item.handle === section?.type),
    [schema.sections, section?.type],
  )
  const formSchema = useMemo(() => buildSettingsSchema(definitionList, localeTab), [definitionList, localeTab])
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: section ? flattenSettings(section.settings, definitionList, localeTab) : {},
  })

  useEffect(() => {
    if (section) form.reset(flattenSettings(section.settings, definitionList, localeTab))
  }, [section, definitionList, localeTab, form])

  if (!section) return <aside className="w-80 shrink-0 border-s p-5 text-sm text-muted-foreground">Select a section to edit its settings.</aside>

  const submit = (values: FormValues) => update(section.id, mergeSettings(values, section.settings, definitionList, localeTab))
  const hasTranslatable = definitionList.some((item) => item.translatable)

  return (
    <aside className="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto border-s p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">{definition?.name ?? section.type}</h2>
        {hasTranslatable && (
          <Tabs value={localeTab} onValueChange={(value) => setLocaleTab(value as 'ar' | 'en')}>
            <TabsList>
              <TabsTrigger value="ar">AR</TabsTrigger>
              <TabsTrigger value="en">EN</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>
      {definitionList.length === 0 ? (
        <p className="text-sm text-muted-foreground">This section has no customizable settings.</p>
      ) : (
        <form className="grid gap-4" onChange={() => void form.handleSubmit(submit)()}>
          {definitionList.map((item) => (
            <SettingField
              key={item.key}
              definition={item}
              locale={localeTab}
              form={form}
              fonts={schema.fonts ?? []}
              products={products}
              onChooseImage={() => setMediaField(settingFieldName(item, localeTab))}
              onCommit={(fieldName, value) => {
                const values = { ...form.getValues(), [fieldName]: value }
                update(section.id, mergeSettings(values, section.settings, definitionList, localeTab))
              }}
            />
          ))}
        </form>
      )}
      <MediaPickerDialog
        scope="subscriber"
        open={Boolean(mediaField)}
        onOpenChange={(open) => {
          if (!open) setMediaField(null)
        }}
        onSelect={(media) => {
          if (mediaField && !Array.isArray(media)) {
            form.setValue(mediaField, resolveMediaUrl(media.url), { shouldDirty: true })
            void form.handleSubmit(submit)()
          }
          setMediaField(null)
        }}
      />
    </aside>
  )
}

type SettingFieldProps = {
  definition: SettingDefinition
  locale: 'ar' | 'en'
  form: ReturnType<typeof useForm<FormValues>>
  fonts: string[]
  products: SellerProduct[]
  onChooseImage: () => void
  /** Persists a value immediately for controls that do not emit native form events. */
  onCommit: (fieldName: string, value: unknown) => void
}

function SettingField({ definition, locale, form, fonts, products, onChooseImage, onCommit }: SettingFieldProps) {
  const name = settingFieldName(definition, locale)
  const label = definition.label || definition.key
  const help = definition.help ? <p className="text-xs text-muted-foreground">{definition.help}</p> : null

  if (definition.type === 'toggle') {
    return (
      <div className="flex items-center justify-between gap-3">
        <div>
          <Label htmlFor={name}>{label}</Label>
          {help}
        </div>
        <Controller
          control={form.control}
          name={name}
          render={({ field }) => <Switch id={name} checked={Boolean(field.value)} onCheckedChange={field.onChange} />}
        />
      </div>
    )
  }

  if (definition.type === 'color') {
    return (
      <div className="grid gap-2">
        <Label htmlFor={name}>{label}</Label>
        <Controller
          control={form.control}
          name={name}
          render={({ field }) => (
            <div className="grid gap-2">
              <HexColorPicker color={typeof field.value === 'string' ? field.value : '#000000'} onChange={field.onChange} />
              <Input id={name} value={typeof field.value === 'string' ? field.value : ''} onChange={field.onChange} placeholder="#000000" />
            </div>
          )}
        />
        {help}
      </div>
    )
  }

  if (definition.type === 'select' || definition.type === 'font') {
    const options = definition.options?.length
      ? definition.options
      : fonts.map((font) => ({ value: font, label: font }))
    return (
      <div className="grid gap-2">
        <Label htmlFor={name}>{label}</Label>
        <Controller
          control={form.control}
          name={name}
          render={({ field }) => (
            <Select value={typeof field.value === 'string' ? field.value : ''} onValueChange={field.onChange}>
              <SelectTrigger id={name} className="w-full">
                <SelectValue placeholder={label} />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {help}
      </div>
    )
  }

  if (definition.type === 'range') {
    const min = definition.min ?? 0
    const max = definition.max ?? 100
    const step = definition.step ?? 1
    return (
      <div className="grid gap-2">
        <Label htmlFor={name}>{label}</Label>
        <Controller
          control={form.control}
          name={name}
          render={({ field }) => (
            <div className="flex items-center gap-3">
              <input
                id={name}
                type="range"
                min={min}
                max={max}
                step={step}
                value={typeof field.value === 'number' ? field.value : Number(field.value) || min}
                onChange={(event) => field.onChange(Number(event.target.value))}
                className="flex-1 accent-primary"
              />
              <Input
                type="number"
                min={min}
                max={max}
                step={step}
                value={typeof field.value === 'number' || typeof field.value === 'string' ? field.value : min}
                onChange={(event) => field.onChange(event.target.value === '' ? '' : Number(event.target.value))}
                className="w-20"
              />
            </div>
          )}
        />
        {help}
      </div>
    )
  }

  if (definition.type === 'number') {
    return (
      <div className="grid gap-2">
        <Label htmlFor={name}>{label}</Label>
        <Controller
          control={form.control}
          name={name}
          render={({ field }) => (
            <Input
              id={name}
              type="number"
              min={definition.min ?? undefined}
              max={definition.max ?? undefined}
              step={definition.step ?? 1}
              value={typeof field.value === 'number' || typeof field.value === 'string' ? field.value : ''}
              onChange={(event) => field.onChange(event.target.value === '' ? '' : Number(event.target.value))}
            />
          )}
        />
        {help}
      </div>
    )
  }

  if (definition.type === 'image') {
    const value = form.watch(name)
    const previewUrl = typeof value === 'string' ? resolveMediaUrl(value) : ''
    return (
      <div className="grid gap-2">
        <Label>{label}</Label>
        <Button type="button" variant="outline" onClick={onChooseImage} className="justify-start gap-2">
          <ImageIcon className="size-4" />
          {typeof value === 'string' && value ? 'Replace image' : 'Choose image'}
        </Button>
        {previewUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt={label} className="h-24 w-full rounded-md border object-cover" />
        )}
        {help}
      </div>
    )
  }

  if (definition.type === 'product') {
    return (
      <div className="grid gap-2">
        <Label htmlFor={name}>{label}</Label>
        <Controller
          control={form.control}
          name={name}
          render={({ field }) => (
            <Select value={typeof field.value === 'string' ? field.value : ''} onValueChange={field.onChange}>
              <SelectTrigger id={name} className="w-full">
                <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {products.length === 0 ? (
                  <SelectItem value="__none__" disabled>
                    No products found
                  </SelectItem>
                ) : (
                  products.map((product) => (
                    <SelectItem key={product.ulid} value={product.ulid}>
                      {product.name || product.internal_name || product.ulid}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}
        />
        {help}
      </div>
    )
  }

  if (definition.type === 'product_list') {
    return (
      <div className="grid gap-2">
        <Label>{label}</Label>
        <Controller
          control={form.control}
          name={name}
          render={({ field }) => {
            const selected = Array.isArray(field.value) ? (field.value as string[]) : []
            return (
              <div className="max-h-44 overflow-y-auto rounded-lg border p-2">
                {products.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No products found</p>
                ) : (
                  products.map((product) => (
                    <label key={product.ulid} className="flex items-center gap-2 py-1 text-sm">
                      <input
                        type="checkbox"
                        checked={selected.includes(product.ulid)}
                        onChange={(event) => {
                          const next = event.target.checked
                            ? [...selected, product.ulid]
                            : selected.filter((id) => id !== product.ulid)
                          field.onChange(next)
                        }}
                        className="size-4 accent-primary"
                      />
                      <span className="truncate">{product.name || product.internal_name || product.ulid}</span>
                    </label>
                  ))
                )}
              </div>
            )
          }}
        />
        {help}
      </div>
    )
  }

  if (definition.type === 'richtext') {
    return (
      <div className="grid gap-2 md:col-span-2">
        <Label>{label}</Label>
        <Controller
          control={form.control}
          name={name}
          render={({ field }) => (
            <RichTextEditor
              value={typeof field.value === 'string' ? field.value : ''}
              onChange={(html) => {
                field.onChange(html)
                onCommit(name, html)
              }}
              placeholder={definition.help ?? `${label}…`}
            />
          )}
        />
        {help}
      </div>
    )
  }

  if (definition.type === 'textarea') {
    return (
      <div className="grid gap-2">
        <Label htmlFor={name}>{label}</Label>
        <Textarea id={name} rows={5} {...form.register(name)} />
        {help}
      </div>
    )
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} type={definition.type === 'url' ? 'url' : 'text'} {...form.register(name)} />
      {help}
    </div>
  )
}
