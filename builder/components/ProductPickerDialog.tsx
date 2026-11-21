'use client'

import { useState } from 'react'
import { Check, Package, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import type { SellerProduct } from '@/lib/seller/resource-client'
import { cn } from '@/lib/utils'
import { resolveMediaUrl } from '@/shared/lib/media-url'

const STATUS_LABELS = ['Draft', 'Published', 'Archived', 'Coming Soon', 'Waitlist']

function enumLabel(value: SellerProduct['status']): string | null {
  if (typeof value === 'string' && value.trim()) return value
  if (typeof value === 'number') return STATUS_LABELS[value - 1] ?? String(value)
  if (value && typeof value === 'object') {
    return value.label ?? (typeof value.id === 'number' ? STATUS_LABELS[value.id - 1] ?? String(value.id) : String(value.id))
  }
  return null
}

function typeLabel(value: SellerProduct['type']): string | null {
  if (typeof value === 'string' && value.trim()) return value
  if (value && typeof value === 'object' && typeof value.label === 'string') return value.label
  return null
}

function priceText(value: SellerProduct['base_price']): string | null {
  if (value === null || value === undefined || value === '') return null
  return String(value)
}

/** Product image for builder cards, with an icon fallback for missing files. */
export function ProductThumbnail({ product, className }: { product: SellerProduct; className?: string }) {
  const [failed, setFailed] = useState(false)
  const src = resolveMediaUrl(product.hero_image_url || product.images?.[0]?.url)

  if (src && !failed) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className={className} onError={() => setFailed(true)} />
  }

  return (
    <div className={cn('flex items-center justify-center bg-muted text-muted-foreground', className)}>
      <Package className="size-5" aria-hidden="true" />
    </div>
  )
}

interface ProductPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  products: SellerProduct[]
  /** ULIDs currently stored on the setting. */
  selected: string[]
  /** `false` renders a single-choice dialog (e.g. the featured-product setting). */
  multiple?: boolean
  onSelect: (ulids: string[]) => void
}

/**
 * Shopper-facing way to attach products to a builder section: each option is a
 * card showing the product image, name, price and status instead of a bare id
 * in a select. Draft selections stay local until the user confirms, so closing
 * the dialog never changes the saved section.
 */
export function ProductPickerDialog({
  open,
  onOpenChange,
  products,
  selected,
  multiple = true,
  onSelect,
}: ProductPickerDialogProps) {
  // The dialog is only mounted while open, so its initial state is always the
  // setting's current value. Closing it discards the draft automatically.
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState<string[]>(selected)

  const normalizedQuery = query.trim().toLowerCase()
  const filtered = normalizedQuery
    ? products.filter((product) =>
      [product.name, product.internal_name, product.sku, product.ulid]
        .some((value) => typeof value === 'string' && value.toLowerCase().includes(normalizedQuery)),
    )
    : products

  const toggle = (ulid: string) => {
    setDraft((current) => {
      if (!multiple) return [ulid]
      return current.includes(ulid) ? current.filter((id) => id !== ulid) : [...current, ulid]
    })
  }

  const confirm = () => {
    onSelect(multiple ? draft : draft.slice(0, 1))
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-2xl">
        <DialogHeader>
          <DialogTitle>{multiple ? 'Choose products' : 'Choose a product'}</DialogTitle>
          <DialogDescription>
            {multiple
              ? 'Select the products you want to show in this section.'
              : 'Select the product you want to show in this section.'}
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products by name or SKU…"
            className="ps-9"
            aria-label="Search products"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            {products.length === 0 ? 'No products found' : 'No products match your search'}
          </p>
        ) : (
          <div className="grid max-h-[50vh] grid-cols-1 gap-3 overflow-y-auto pe-1 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((product) => {
              const isSelected = draft.includes(product.ulid)
              const name = product.name || product.internal_name || product.ulid
              const salePrice = priceText(product.sale_price)
              const basePrice = priceText(product.base_price)
              const currency = product.currency ?? ''
              const status = enumLabel(product.status)
              const type = typeLabel(product.type)

              return (
                <button
                  key={product.ulid}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => toggle(product.ulid)}
                  className={cn(
                    'overflow-hidden rounded-lg border bg-card text-start transition-colors hover:border-primary',
                    isSelected && 'border-primary ring-2 ring-primary/60',
                  )}
                >
                  <div className="relative aspect-video bg-muted">
                    <ProductThumbnail product={product} className="size-full object-cover" />
                    {isSelected ? (
                      <span className="absolute end-2 top-2 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-3.5" aria-hidden="true" />
                      </span>
                    ) : null}
                    {status ? (
                      <span className="absolute start-2 top-2 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-medium">
                        {status}
                      </span>
                    ) : null}
                  </div>
                  <div className="grid gap-1 p-2.5">
                    <p className="truncate text-sm font-medium">{name}</p>
                    {product.internal_name && product.internal_name !== name ? (
                      <p className="truncate text-[11px] text-muted-foreground">{product.internal_name}</p>
                    ) : null}
                    <div className="flex flex-wrap items-baseline gap-x-2 text-xs">
                      <span className="font-medium text-primary">
                        {salePrice ?? basePrice ?? '—'}
                        {currency ? ` ${currency}` : ''}
                      </span>
                      {salePrice && basePrice && salePrice !== basePrice ? (
                        <span className="text-muted-foreground line-through">
                          {basePrice}
                          {currency ? ` ${currency}` : ''}
                        </span>
                      ) : null}
                      {type ? <span className="ms-auto text-[10px] text-muted-foreground">{type}</span> : null}
                    </div>
                    {product.sku ? (
                      <p className="truncate font-mono text-[10px] text-muted-foreground">SKU: {product.sku}</p>
                    ) : null}
                  </div>
                </button>
              )
            })}
          </div>
        )}

        <DialogFooter>
          <p className="me-auto self-center text-xs text-muted-foreground">
            {draft.length === 0
              ? 'Nothing selected'
              : `${draft.length} selected`}
          </p>
          {draft.length > 0 ? (
            <Button type="button" variant="ghost" onClick={() => setDraft([])}>
              Clear
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={draft.length === 0} onClick={confirm}>
            {multiple ? `Add ${draft.length} product${draft.length === 1 ? '' : 's'}` : 'Select product'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
