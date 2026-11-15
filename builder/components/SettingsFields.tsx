'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { Controller, type UseFormReturn } from 'react-hook-form'
import { HexColorPicker } from 'react-colorful'
import { ImageIcon, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MediaPickerDialog } from '@/components/shared/MediaPickerDialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { SettingDefinition } from '@/shared/types/builder'
import { settingFieldName } from '@/builder/lib/settings-form'
import { RichTextEditor } from '@/builder/components/RichTextEditor'
import { resolveMediaUrl } from '@/shared/lib/media-url'
import type { SellerProduct } from '@/lib/seller/resource-client'

export type SettingsFormValues = Record<string, unknown>

export interface SettingsFieldsProps {
  definitions: SettingDefinition[]
  form: UseFormReturn<SettingsFormValues>
  locale: 'ar' | 'en'
  fonts: string[]
  products: SellerProduct[]
  /** Persist one edited field. Always called with the field's own new value. */
  onCommit: (fieldName: string, value: unknown) => void
}

/**
 * Renders a schema-driven settings form and persists every control change on
 * its own. Committing individual fields (instead of the whole flattened form)
 * is what lets a user clear a value without it snapping back to the schema
 * default, and it keeps edits independent of react-hook-form validation.
 */
export function SettingsFields({ definitions, form, locale, fonts, products, onCommit }: SettingsFieldsProps) {
  const [mediaField, setMediaField] = useState<string | null>(null)

  return (
    <>
      <form className="grid gap-4" onSubmit={(event) => event.preventDefault()}>
        {definitions.map((definition) => (
          <SettingField
            key={definition.key}
            definition={definition}
            locale={locale}
            form={form}
            fonts={fonts}
            products={products}
            onChooseImage={() => setMediaField(settingFieldName(definition, locale))}
            onCommit={onCommit}
          />
        ))}
      </form>
      <MediaPickerDialog
        scope="subscriber"
        open={Boolean(mediaField)}
        onOpenChange={(open) => {
          if (!open) setMediaField(null)
        }}
        onSelect={(media) => {
          if (mediaField && !Array.isArray(media)) {
            const url = resolveMediaUrl(media.url)
            form.setValue(mediaField, url, { shouldDirty: true })
            onCommit(mediaField, url)
          }
          setMediaField(null)
        }}
      />
    </>
  )
}

type SettingFieldProps = {
  definition: SettingDefinition
  locale: 'ar' | 'en'
  form: UseFormReturn<SettingsFormValues>
  fonts: string[]
  products: SellerProduct[]
  onChooseImage: () => void
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
          render={({ field }) => (
            <Switch
              id={name}
              checked={Boolean(field.value)}
              onCheckedChange={(checked) => {
                field.onChange(checked)
                onCommit(name, checked)
              }}
            />
          )}
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
              <HexColorPicker
                color={typeof field.value === 'string' ? field.value : '#000000'}
                onChange={(color) => {
                  field.onChange(color)
                  onCommit(name, color)
                }}
              />
              <Input
                id={name}
                value={typeof field.value === 'string' ? field.value : ''}
                onChange={(event) => {
                  field.onChange(event.target.value)
                  onCommit(name, event.target.value)
                }}
                placeholder="#000000"
              />
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
            <Select
              value={typeof field.value === 'string' ? field.value : ''}
              onValueChange={(value) => {
                field.onChange(value)
                onCommit(name, value)
              }}
            >
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
                onChange={(event) => {
                  const value = Number(event.target.value)
                  field.onChange(value)
                  onCommit(name, value)
                }}
                className="flex-1 accent-primary"
              />
              <Input
                type="number"
                min={min}
                max={max}
                step={step}
                value={typeof field.value === 'number' || typeof field.value === 'string' ? field.value : min}
                onChange={(event) => {
                  const value = event.target.value === '' ? '' : Number(event.target.value)
                  field.onChange(value)
                  onCommit(name, value)
                }}
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
              onChange={(event) => {
                const value = event.target.value === '' ? '' : Number(event.target.value)
                field.onChange(value)
                onCommit(name, value)
              }}
            />
          )}
        />
        {help}
      </div>
    )
  }

  if (definition.type === 'image') {
    return (
      <ImageSettingField
        name={name}
        label={label}
        help={help}
        value={typeof form.watch(name) === 'string' ? (form.watch(name) as string) : ''}
        form={form}
        onChooseImage={onChooseImage}
        onCommit={onCommit}
      />
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
            <Select
              value={typeof field.value === 'string' ? field.value : ''}
              onValueChange={(value) => {
                field.onChange(value)
                onCommit(name, value)
              }}
            >
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
                          onCommit(name, next)
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
      <div className="grid gap-2">
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
        <Controller
          control={form.control}
          name={name}
          render={({ field }) => (
            <Textarea
              id={name}
              rows={5}
              value={typeof field.value === 'string' ? field.value : ''}
              onChange={(event) => {
                field.onChange(event.target.value)
                onCommit(name, event.target.value)
              }}
            />
          )}
        />
        {help}
      </div>
    )
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Controller
        control={form.control}
        name={name}
        render={({ field }) => (
          <Input
            id={name}
            type={definition.type === 'url' ? 'url' : 'text'}
            value={typeof field.value === 'string' ? field.value : ''}
            onChange={(event) => {
              field.onChange(event.target.value)
              onCommit(name, event.target.value)
            }}
          />
        )}
      />
      {help}
    </div>
  )
}

/**
 * Image settings accept either a media-library pick or a hand-written URL.
 * The preview reports a failed load instead of showing a broken icon, which is
 * how a file that is missing on the backend storage becomes visible.
 */
function ImageSettingField({
  name,
  label,
  help,
  value,
  form,
  onChooseImage,
  onCommit,
}: {
  name: string
  label: string
  help: ReactNode
  value: string
  form: UseFormReturn<SettingsFormValues>
  onChooseImage: () => void
  onCommit: (fieldName: string, value: unknown) => void
}) {
  const [failedValue, setFailedValue] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const previewUrl = resolveMediaUrl(value)
  const failed = value !== '' && failedValue === value

  const setValue = (next: string) => {
    form.setValue(name, next, { shouldDirty: true })
    onCommit(name, next)
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onChooseImage} className="flex-1 justify-start gap-2">
          <ImageIcon className="size-4" aria-hidden="true" />
          {value ? 'Replace image' : 'Choose image'}
        </Button>
        {value ? (
          <Button type="button" variant="ghost" onClick={() => setValue('')}>
            Clear
          </Button>
        ) : null}
      </div>
      <Input
        id={name}
        value={value}
        placeholder="/storage/media/… or https://…"
        onChange={(event) => form.setValue(name, event.target.value, { shouldDirty: true })}
        onBlur={(event) => onCommit(name, event.target.value)}
      />
      {previewUrl ? (
        <div className="relative">
          {failed ? (
            <div className="flex flex-col items-center gap-2 rounded-md border border-dashed p-3 text-center">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                This image could not be loaded. The file may be missing on the storage server.
              </p>
              <code className="max-w-full truncate text-[10px] text-muted-foreground">{previewUrl}</code>
              <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={() => { setFailedValue(null); setAttempt((current) => current + 1) }}>
                <RefreshCw className="size-3.5" aria-hidden="true" />
                Retry
              </Button>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${previewUrl}-${attempt}`}
              src={previewUrl}
              alt={label}
              className="h-24 w-full rounded-md border object-cover"
              onError={() => setFailedValue(value)}
            />
          )}
        </div>
      ) : null}
      {help}
    </div>
  )
}
