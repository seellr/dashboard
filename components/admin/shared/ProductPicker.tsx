'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useProductsAllQuery } from '@/hooks/queries/useProductsAll'

interface ProductPickerProps {
  value: string | null
  onChange: (ulid: string | null) => void
  placeholder?: string
}

export function ProductPicker({ value, onChange, placeholder = 'Select product…' }: ProductPickerProps) {
  const [open, setOpen] = useState(false)
  const { data: products = [] } = useProductsAllQuery()

  const selected = products.find((p) => p.ulid === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        role="combobox"
        aria-expanded={open}
        className={cn(buttonVariants({ variant: 'outline' }), 'w-full justify-between font-normal')}
      >
        {selected ? (
          <span className="flex items-center gap-2 truncate">
            {selected.hero_image_url ? (
              <img src={selected.hero_image_url} alt="" className="h-5 w-5 rounded object-cover" />
            ) : (
              <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <span className="truncate">{selected.name || selected.internal_name}</span>
          </span>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search products…" />
          <CommandList>
            <CommandEmpty>No products found.</CommandEmpty>
            <CommandGroup>
              {value && (
                <CommandItem
                  value="__clear__"
                  onSelect={() => { onChange(null); setOpen(false) }}
                  className="text-muted-foreground italic"
                >
                  Clear selection
                </CommandItem>
              )}
              {products.map((product) => (
                <CommandItem
                  key={product.ulid}
                  value={`${product.name} ${product.internal_name} ${product.ulid}`}
                  onSelect={() => { onChange(product.ulid); setOpen(false) }}
                >
                  <Check className={cn('mr-2 h-4 w-4', value === product.ulid ? 'opacity-100' : 'opacity-0')} />
                  {product.hero_image_url ? (
                    <img src={product.hero_image_url} alt="" className="mr-2 h-6 w-6 rounded object-cover" />
                  ) : (
                    <Package className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className="truncate">{product.name || product.internal_name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{product.type.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
