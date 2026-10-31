'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createSellerProduct, deleteSellerProduct, listSellerProducts, updateSellerProduct, type SellerProduct } from '@/lib/seller/resource-client'

export function SellerProductsClient() {
  const [items, setItems] = useState<SellerProduct[]>([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const load = async () => { setLoading(true); const result = await listSellerProducts('?per_page=15'); if (result.ok) setItems(result.data.items); else setMessage(result.message); setLoading(false) }
  useEffect(() => { void Promise.resolve().then(load) }, [])
  const create = async () => {
    if (!name.trim()) return
    setMessage('')
    const result = await createSellerProduct({ internal_name: name.trim(), type: 1, delivery_method: 1, base_price: 0, currency: 'USD', vat_rule: 3, translations: { ar: { name: name.trim() } } })
    if (!result.ok) setMessage(result.message); else { setName(''); await load() }
  }
  const toggle = async (item: SellerProduct) => { const id = typeof item.status === 'object' && item.status !== null ? item.status.id : item.status; const result = await updateSellerProduct(item.ulid, { status: id === 2 ? 1 : 2 }); if (!result.ok) setMessage(result.message); else await load() }
  const remove = async (ulid: string) => { if (!window.confirm('Delete this product?')) return; const result = await deleteSellerProduct(ulid); if (!result.ok) setMessage(result.message); else await load() }
  return <section className="space-y-4">
    <div className="flex flex-wrap items-center gap-2"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Internal product name" className="max-w-sm" /><Button onClick={() => void create()} disabled={!name.trim()}>Create draft</Button><Button variant="outline" onClick={() => void load()}>Refresh</Button></div>
    {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
    {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : <div className="divide-y rounded-lg border">{items.length === 0 && <p className="p-4 text-sm text-muted-foreground">No products yet.</p>}{items.map((item) => { const status = typeof item.status === 'object' && item.status !== null ? item.status.label : String(item.status ?? 'Draft'); const statusId = typeof item.status === 'object' && item.status !== null ? item.status.id : item.status; return <div key={item.ulid} className="flex items-center justify-between gap-4 p-4"><div><p className="font-medium">{item.name ?? item.internal_name ?? item.ulid}</p><p className="text-sm text-muted-foreground">{status} · {item.base_price ?? '0'} {item.currency ?? ''}</p></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => void toggle(item)}>{statusId === 2 ? 'Archive' : 'Publish'}</Button><Button variant="destructive" size="sm" onClick={() => void remove(item.ulid)}>Delete</Button></div></div> })}</div>}
  </section>
}
