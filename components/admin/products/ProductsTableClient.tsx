'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { type ColumnDef } from '@tanstack/react-table'
import {
  Search,
  Filter,
  CheckCircle2,
  Archive,
  Trash2,
  Edit,
  RotateCw,
  Plus,
  Star,
  ExternalLink,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable } from '@/components/ui/data-table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useProductsQuery, useDeleteProduct, useUpdateProduct } from '@/hooks/queries/useProducts'
import { ProductWizardDialog } from './ProductWizardDialog'
import { BRANDS, useActiveBrand } from '@/lib/admin/brand-context'
import {
  ProductTypeLabels,
  ProductTypeValues,
  ProductStatusLabels,
  ProductStatusValues,
  type Product,
} from '@/types/dto/product.dto'

export function ProductsTableClient({ locale }: { locale: string }) {
  const t = useTranslations('admin.products')
  const { activeBrand, setActiveBrand } = useActiveBrand()

  // Filters
  const [search, setSearch] = useState('')
  const [selectedBrandId, setSelectedBrandId] = useState<string>(String(activeBrand?.id || 'all'))
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [featuredFilter, setFeaturedFilter] = useState<string>('all')

  // Cursor Pagination & Data
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [accumulatedProducts, setAccumulatedProducts] = useState<Product[]>([])

  const { data, isLoading, isFetching, refetch } = useProductsQuery({
    cursor,
    filter_brand_id: selectedBrandId !== 'all' ? Number(selectedBrandId) : undefined,
    type: selectedType !== 'all' ? Number(selectedType) : undefined,
    status: selectedStatus !== 'all' ? Number(selectedStatus) : undefined,
    featured: featuredFilter === 'featured' ? true : featuredFilter === 'standard' ? false : undefined,
    per_page: 20,
  })

  // Edit & Delete state
  const [wizardUlid, setWizardUlid] = useState<string | null>(null)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null)

  const deleteMutation = useDeleteProduct()
  const updateMutation = useUpdateProduct(pendingDelete?.ulid ?? '')

  // Reset pagination when filters change
  const handleFilterBrand = (val: string | null) => {
    const brandVal = val ?? 'all'
    setSelectedBrandId(brandVal)
    setCursor(undefined)
    if (brandVal !== 'all') {
      const match = BRANDS.find((b) => b.id === Number(brandVal))
      if (match) setActiveBrand(match)
    }
  }

  const handleFilterType = (val: string | null) => {
    setSelectedType(val ?? 'all')
    setCursor(undefined)
  }

  const handleFilterStatus = (val: string | null) => {
    setSelectedStatus(val ?? 'all')
    setCursor(undefined)
  }

  const items = data?.items ?? []
  const hasMore = Boolean(data?.meta?.has_more)
  const nextCursor = data?.meta?.next_cursor

  // Client search filter on retrieved items
  const filteredItems = useMemo(() => {
    if (!search.trim()) return items
    const q = search.toLowerCase()
    return items.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.internal_name?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q),
    )
  }, [items, search])

  const handleLoadMore = () => {
    if (hasMore && nextCursor) {
      setCursor(nextCursor)
    }
  }

  const handleQuickPublishToggle = async (product: Product, e: React.MouseEvent) => {
    e.stopPropagation()
    const targetStatus = product.status?.id === 2 ? 1 : 2 // Toggle between Published and Draft
    await updateMutation.mutateAsync({ status: targetStatus })
    refetch()
  }

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return
    await deleteMutation.mutateAsync(pendingDelete.ulid)
    setPendingDelete(null)
    refetch()
  }

  const getStatusBadge = (statusId?: number | null, label?: string) => {
    switch (statusId) {
      case 2:
        return <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px]">{label || 'Published'}</Badge>
      case 1:
        return <Badge variant="secondary" className="text-[11px]">{label || 'Draft'}</Badge>
      case 3:
        return <Badge variant="outline" className="text-muted-foreground text-[11px]">{label || 'Archived'}</Badge>
      case 4:
        return <Badge variant="outline" className="text-amber-600 border-amber-300 text-[11px]">{label || 'Coming Soon'}</Badge>
      case 5:
        return <Badge variant="outline" className="text-blue-600 border-blue-300 text-[11px]">{label || 'Waitlist'}</Badge>
      default:
        return <Badge variant="secondary" className="text-[11px]">{label || 'Draft'}</Badge>
    }
  }

  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        id: 'hero',
        header: '',
        enableSorting: false,
        size: 50,
        cell: ({ row }) => (
          <div className="size-10 rounded-md overflow-hidden bg-muted/40 border flex items-center justify-center shrink-0">
            {row.original.hero_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={row.original.hero_image_url}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <span className="text-[10px] text-muted-foreground">None</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'name',
        header: t('table.name'),
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm">
                {row.original.name || row.original.internal_name}
              </span>
              {row.original.featured && (
                <Star className="size-3.5 fill-amber-400 text-amber-500" title="Featured Product" />
              )}
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {row.original.sku || row.original.ulid}
            </span>
          </div>
        ),
      },
      {
        accessorFn: (row) => row.type?.label,
        id: 'type',
        header: t('table.type'),
        cell: ({ row }) => (
          <Badge variant="outline" className="text-xs">
            {row.original.type?.label}
          </Badge>
        ),
      },
      {
        accessorFn: (row) => Number(row.base_price),
        id: 'price',
        header: t('table.price'),
        cell: ({ row }) => (
          <div className="flex flex-col text-xs">
            <span className="font-medium">
              {row.original.base_price} {row.original.currency}
            </span>
            {row.original.sale_price ? (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                Sale: {row.original.sale_price} {row.original.currency}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        accessorFn: (row) => row.status?.label,
        id: 'status',
        header: t('table.status'),
        cell: ({ row }) => getStatusBadge(row.original.status?.id, row.original.status?.label),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1.5">
            {/* Quick Publish / Unpublish Toggle */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => handleQuickPublishToggle(row.original, e)}
              className="text-xs h-7 px-2"
              title={row.original.status?.id === 2 ? 'Unpublish to Draft' : 'Publish to Store'}
            >
              {row.original.status?.id === 2 ? (
                <span className="text-muted-foreground">Draft</span>
              ) : (
                <span className="text-emerald-600 font-medium">Publish</span>
              )}
            </Button>

            {/* Edit button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs h-7 px-2.5 gap-1"
              onClick={() => {
                setWizardUlid(row.original.ulid)
                setWizardOpen(true)
              }}
            >
              <Edit className="size-3" />
              {t('table.edit')}
            </Button>

            {/* Delete button */}
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => setPendingDelete(row.original)}
              className="text-muted-foreground hover:text-destructive"
              title={t('table.delete')}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    [t, updateMutation, refetch],
  )

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-center">
        {/* Search */}
        <div className="relative md:col-span-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('table.search')}
            className="ps-9"
          />
        </div>

        {/* Brand Selector */}
        <Select value={selectedBrandId} onValueChange={handleFilterBrand}>
          <SelectTrigger>
            <SelectValue placeholder={t('wizard.allBrands')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('wizard.allBrands')}</SelectItem>
            {BRANDS.map((b) => (
              <SelectItem key={b.id} value={String(b.id)}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Type Filter */}
        <Select value={selectedType} onValueChange={handleFilterType}>
          <SelectTrigger>
            <SelectValue placeholder={t('wizard.allTypes')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('wizard.allTypes')}</SelectItem>
            {ProductTypeValues.map((typeVal) => (
              <SelectItem key={typeVal} value={String(typeVal)}>
                {ProductTypeLabels[typeVal]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={selectedStatus} onValueChange={handleFilterStatus}>
          <SelectTrigger>
            <SelectValue placeholder={t('wizard.allStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('wizard.allStatus')}</SelectItem>
            {ProductStatusValues.map((statusVal) => (
              <SelectItem key={statusVal} value={String(statusVal)}>
                {ProductStatusLabels[statusVal]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Featured Filter */}
        <Select value={featuredFilter} onValueChange={(val) => setFeaturedFilter(val ?? 'all')}>
          <SelectTrigger>
            <SelectValue placeholder="All Catalog" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Catalog</SelectItem>
            <SelectItem value="featured">Featured Only</SelectItem>
            <SelectItem value="standard">Standard Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products Data Table */}
      <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredItems}
        />
      </div>

      {/* Cursor Pagination Load More */}
      {hasMore && (
        <div className="flex justify-center pt-2 pb-6">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleLoadMore}
            disabled={isFetching}
            className="gap-2 text-xs"
          >
            {isFetching ? <RotateCw className="size-3.5 animate-spin" /> : null}
            {t('wizard.loadMore')}
          </Button>
        </div>
      )}

      {/* Multi-step Product Wizard Dialog */}
      <ProductWizardDialog
        ulid={wizardUlid}
        open={wizardOpen}
        onOpenChange={(open) => {
          setWizardOpen(open)
          if (!open) {
            setWizardUlid(null)
            refetch()
          }
        }}
        onSuccess={() => {
          refetch()
        }}
      />

      {/* Delete Confirmation Alert */}
      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('form.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('form.deleteConfirmBody')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('form.deleteCancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {deleteMutation.isPending ? t('wizard.saving') : t('form.deleteConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
