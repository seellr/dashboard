'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { Package, Plus } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  deleteSellerProduct,
  listSellerProducts,
  updateSellerProduct,
  type SellerProduct,
} from '@/lib/seller/resource-client'

// Documented ProductType enum: 1..9.
const PRODUCT_TYPES = [
  'Ebook',
  'Template',
  'Playbook',
  'Notion System',
  'Prompts Pack',
  'Bundle',
  'Course',
  'AI Tool',
  'Quiz',
]

const PRODUCT_STATUSES = ['Draft', 'Published', 'Archived', 'Coming Soon', 'Waitlist']

function enumId(value: SellerProduct['status']): number | null {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value)
  if (value && typeof value === 'object') return typeof value.id === 'string' ? Number(value.id) : value.id
  return null
}

function label(value: SellerProduct['status'], labels: string[]): string {
  if (value && typeof value === 'object' && value.label) return value.label
  const id = enumId(value)
  return id ? (labels[id - 1] ?? String(id)) : '—'
}

export function SellerProductsClient() {
  const t = useTranslations('seller.products')
  const locale = useLocale()
  const [items, setItems] = useState<SellerProduct[]>([])
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  const load = useCallback(
    async (append = false, nextCursor?: string | null) => {
      setLoading(true)
      const params = new URLSearchParams({ per_page: '15' })
      if (type) params.set('type', type)
      if (status) params.set('status', status)
      if (append && nextCursor) params.set('cursor', nextCursor)
      const result = await listSellerProducts(`?${params.toString()}`)
      setLoading(false)
      if (!result.ok) {
        setMessage(result.message)
        return
      }
      setMessage('')
      setItems((previous) =>
        append ? [...previous, ...result.data.items] : result.data.items,
      )
      setCursor(result.data.meta?.next_cursor ?? null)
      setHasMore(result.data.meta?.has_more === true)
    },
    [status, type],
  )

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  const run = async (id: string, action: () => Promise<{ ok: boolean; message?: string }>) => {
    setBusy(id)
    setMessage('')
    const result = await action()
    setBusy(null)
    if (!result.ok) setMessage(result.message ?? t('genericError'))
    else await load()
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label={t('filterStatus')}
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="h-8 rounded-lg border bg-background px-2 text-sm"
        >
          <option value="">{t('allStatuses')}</option>
          {PRODUCT_STATUSES.map((entry, index) => (
            <option key={entry} value={index + 1}>
              {entry}
            </option>
          ))}
        </select>
        <select
          aria-label={t('filterType')}
          value={type}
          onChange={(event) => setType(event.target.value)}
          className="h-8 rounded-lg border bg-background px-2 text-sm"
        >
          <option value="">{t('allTypes')}</option>
          {PRODUCT_TYPES.map((entry, index) => (
            <option key={entry} value={index + 1}>
              {entry}
            </option>
          ))}
        </select>
        <Link
          href={`/${locale}/seller/products/new`}
          className={buttonVariants({ className: 'gap-2' })}
        >
          <Plus className="size-4" aria-hidden="true" />
          {t('newProduct')}
        </Link>
      </div>

      {message && (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      )}

      <div className="rounded-lg border">
        {loading && items.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            {t('loading')}
          </p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-8 text-center">
            <Package className="size-8 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">{t('empty')}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('table.name')}</TableHead>
                <TableHead>{t('table.type')}</TableHead>
                <TableHead>{t('table.status')}</TableHead>
                <TableHead>{t('table.price')}</TableHead>
                <TableHead>{t('table.vat')}</TableHead>
                <TableHead>{t('table.delivery')}</TableHead>
                <TableHead>{t('table.featured')}</TableHead>
                <TableHead className="text-end">{t('table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const statusId = enumId(item.status)
                return (
                  <TableRow key={item.ulid}>
                    <TableCell>
                      <Link href={`/${locale}/seller/products/${item.ulid}`} className="font-medium hover:underline">
                        {item.name ?? item.internal_name ?? item.ulid}
                      </Link>
                      <p className="text-xs text-muted-foreground">{item.slug ?? item.internal_name ?? item.ulid}</p>
                    </TableCell>
                    <TableCell>{label(item.type, PRODUCT_TYPES)}</TableCell>
                    <TableCell>{label(item.status, PRODUCT_STATUSES)}</TableCell>
                    <TableCell>{item.base_price ?? '0'} {item.currency ?? ''}{item.sale_price != null && <p className="text-xs text-muted-foreground">{t('table.sale')}: {item.sale_price} {item.currency ?? ''}</p>}</TableCell>
                    <TableCell>{label(item.vat_rule, ['VAT included', 'VAT added', 'VAT exempt'])}</TableCell>
                    <TableCell>{label(item.delivery_method, ['File download', 'External link', 'Notion link', 'Interactive', 'Discord', 'Telegram', 'Calendly', 'Physical'])}</TableCell>
                    <TableCell>{item.featured ? t('table.yes') : t('table.no')}</TableCell>
                    <TableCell><div className="flex justify-end gap-2"><Button size="sm" variant="outline" disabled={busy === item.ulid} onClick={() => void run(item.ulid, () => updateSellerProduct(item.ulid, { status: statusId === 2 ? 1 : 2 }))}>{statusId === 2 ? t('archive') : t('publish')}</Button><Button size="sm" variant="destructive" disabled={busy === item.ulid} onClick={() => { if (window.confirm(t('confirmDelete'))) void run(item.ulid, () => deleteSellerProduct(item.ulid)) }}>{t('delete')}</Button></div></TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {hasMore && (
        <Button
          variant="outline"
          disabled={loading}
          onClick={() => void load(true, cursor)}
        >
          {t('loadMore')}
        </Button>
      )}
    </section>
  )
}
