'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Controller, type UseFormReturn } from 'react-hook-form'
import { HexColorPicker } from 'react-colorful'
import { ImageIcon, Plus, RefreshCw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MediaPickerDialog } from '@/components/shared/MediaPickerDialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { SettingDefinition } from '@/shared/types/builder'
import { settingFieldName } from '@/builder/lib/settings-form'
import { ColumnCountField } from '@/builder/components/ColumnCountField'
import { ProductPickerDialog, ProductThumbnail } from '@/builder/components/ProductPickerDialog'
import { RichTextEditor } from '@/builder/components/RichTextEditor'
import { resolveMediaUrl } from '@/shared/lib/media-url'
import type { SellerProduct } from '@/lib/seller/resource-client'

export type SettingsFormValues = Record<string, unknown>

function selectedProductUlids(value: unknown, multiple: boolean): string[] {
  if (multiple) return Array.isArray(value) ? value.map(String) : []
  return typeof value === 'string' && value ? [value] : []
}

const COLUMN_SETTING_KEYS = new Set(['columns', 'slides_per_view'])

function isColumnSetting(definition: SettingDefinition): boolean {
  return COLUMN_SETTING_KEYS.has(definition.key) && ['number', 'range', 'select', 'text'].includes(definition.type)
}

export interface SettingsFieldsProps {
  definitions: SettingDefinition[]
  form: UseFormReturn<SettingsFormValues>
  locale: 'ar' | 'en'
  fonts: string[]
  products: SellerProduct[]
  /** Persist one edited field. Always called with the field's own new value. */
  onCommit: (fieldName: string, value: unknown) => void
  /**
   * Field the user clicked in the live preview. `token` changes on every click
   * so clicking the same text twice scrolls back to it again.
   */
  focusTarget?: { name: string; token: number } | null
}

/**
 * Renders a schema-driven settings form and persists every control change on
 * its own. Committing individual fields (instead of the whole flattened form)
 * is what lets a user clear a value without it snapping back to the schema
 * default, and it keeps edits independent of react-hook-form validation.
 */
export function SettingsFields({ definitions, form, locale, fonts, products, onCommit, focusTarget }: SettingsFieldsProps) {
  const [mediaField, setMediaField] = useState<string | null>(null)
  const [productField, setProductField] = useState<{ name: string; multiple: boolean } | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const [highlighted, setHighlighted] = useState<string | null>(null)

  useEffect(() => {
    if (!focusTarget) return
    const root = formRef.current
    if (!root) return
    const name = focusTarget.name.replace(/"/g, '\\"')
    const wrapper = root.querySelector<HTMLElement>(`[data-setting-field="${name}"]`)
    if (!wrapper) return
    setHighlighted(focusTarget.name)
    wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const control = wrapper.querySelector<HTMLElement>(
      'input:not([type="hidden"]), textarea, select, [contenteditable="true"], button',
    )
    // Focusing the same element twice in a row is a no-op in some browsers,
    // so blur first when the field is already active.
    if (control) control.focus({ preventScroll: true })
    const timer = window.setTimeout(() => setHighlighted(null), 2400)
    return () => window.clearTimeout(timer)
  }, [focusTarget])

  return (
    <>
      <form ref={formRef} className="grid gap-4" onSubmit={(event) => event.preventDefault()}>
        {definitions.map((definition) => (
          <div
            key={definition.key}
            data-setting-field={settingFieldName(definition, locale)}
            className={`rounded-xl border border-border/70 bg-card p-3 shadow-xs transition-all hover:border-primary/30 hover:shadow-sm ${
              highlighted === settingFieldName(definition, locale)
                ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-background'
                : ''
            }`}
          >
            <SettingField
              definition={definition}
              locale={locale}
              form={form}
              fonts={fonts}
              products={products}
              onChooseImage={() => setMediaField(settingFieldName(definition, locale))}
              onChooseProduct={(name, multiple) => setProductField({ name, multiple })}
              onCommit={onCommit}
            />
          </div>
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
      {productField ? (
        <ProductPickerDialog
          key={productField.name}
          open
          onOpenChange={(open) => {
            if (!open) setProductField(null)
          }}
          products={products}
          multiple={productField.multiple}
          selected={selectedProductUlids(form.getValues(productField.name), productField.multiple)}
          onSelect={(ulids) => {
            const value = productField.multiple ? ulids : (ulids[0] ?? '')
            form.setValue(productField.name, value, { shouldDirty: true })
            onCommit(productField.name, value)
            setProductField(null)
          }}
        />
      ) : null}
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
  onChooseProduct: (fieldName: string, multiple: boolean) => void
  onCommit: (fieldName: string, value: unknown) => void
}

function SettingField({ definition, locale, form, fonts, products, onChooseImage, onChooseProduct, onCommit }: SettingFieldProps) {
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

  if (isColumnSetting(definition)) {
    return (
      <ColumnCountField
        definition={definition}
        form={form}
        name={name}
        label={label}
        help={help}
        onCommit={onCommit}
      />
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
        <Label>{label}</Label>
        <Controller
          control={form.control}
          name={name}
          render={({ field }) => {
            const value = typeof field.value === 'string' ? field.value : ''
            const selected = products.find((product) => product.ulid === value)
            return (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 justify-start gap-2"
                  onClick={() => onChooseProduct(name, false)}
                >
                  {selected ? (
                    <>
                      <ProductThumbnail product={selected} className="size-5 shrink-0 rounded object-cover" />
                      <span className="truncate">{selected.name || selected.internal_name || selected.ulid}</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">Select {label.toLowerCase()}</span>
                  )}
                </Button>
                {value ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      field.onChange('')
                      onCommit(name, '')
                    }}
                  >
                    Clear
                  </Button>
                ) : null}
              </div>
            )
          }}
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
            const selectedProducts = selected
              .map((ulid) => products.find((product) => product.ulid === ulid))
              .filter((product): product is SellerProduct => Boolean(product))

            const commit = (next: string[]) => {
              field.onChange(next)
              onCommit(name, next)
            }

            return (
              <div className="grid gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="justify-start gap-1.5"
                  onClick={() => onChooseProduct(name, true)}
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Add products
                </Button>
                {selectedProducts.length > 0 ? (
                  <div className="max-h-44 space-y-1 overflow-y-auto rounded-lg border p-2">
                    {selectedProducts.map((product) => (
                      <div key={product.ulid} className="flex items-center gap-2 rounded-md px-1 py-1 text-sm">
                        <ProductThumbnail product={product} className="size-8 shrink-0 rounded object-cover" />
                        <span className="min-w-0 flex-1 truncate">
                          {product.name || product.internal_name || product.ulid}
                        </span>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          aria-label={`Remove ${product.name || product.internal_name || product.ulid}`}
                          onClick={() => commit(selected.filter((id) => id !== product.ulid))}
                        >
                          <X className="size-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No products selected yet.</p>
                )}
                {selected.length > 0 ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="justify-self-start"
                    onClick={() => commit([])}
                  >
                    Clear all
                  </Button>
                ) : null}
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
