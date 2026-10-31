'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createSellerProduct, deleteSellerProduct, listSellerProducts, saveSellerProductDelivery, saveSellerProductDescription, saveSellerProductFunnel, saveSellerProductSeo, updateSellerProduct, type SellerProduct } from '@/lib/seller/resource-client'

const types = ['Ebook', 'Template', 'Playbook', 'Notion System', 'Prompts Pack', 'Bundle', 'Course', 'AI Tool', 'Quiz', 'Audio', 'Membership', 'Challenge', 'Consultation']
const statuses = ['Draft', 'Published', 'Archived', 'Coming Soon', 'Waitlist']

function statusId(value: SellerProduct['status']): number { return typeof value === 'object' && value !== null ? value.id : typeof value === 'number' ? value : 1 }

export function SellerProductWorkspace() {
  const [items, setItems] = useState<SellerProduct[]>([])
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')
  const [selected, setSelected] = useState<SellerProduct | null>(null)
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [basePrice, setBasePrice] = useState('0')
  const [currency, setCurrency] = useState('USD')
  const [productType, setProductType] = useState('1')
  const [deliveryMethod, setDeliveryMethod] = useState('1')
  const [description, setDescription] = useState('')
  const [deliveryUrl, setDeliveryUrl] = useState('')
  const [seoTitle, setSeoTitle] = useState('')
  const [funnelJson, setFunnelJson] = useState('{}')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const query = new URLSearchParams({ per_page: '100' }); if (filterStatus) query.set('status', filterStatus); if (filterType) query.set('type', filterType)
    const result = await listSellerProducts(`?${query.toString()}`); if (result.ok) setItems(result.data.items); else setMessage(result.message)
  }
  useEffect(() => { void Promise.resolve().then(load) }, [filterStatus, filterType])

  const startNew = () => { setSelected(null); setName(''); setBasePrice('0'); setCurrency('USD'); setProductType('1'); setDeliveryMethod('1'); setDescription(''); setDeliveryUrl(''); setSeoTitle(''); setFunnelJson('{}'); setStep(0); setMessage('') }
  const open = (item: SellerProduct) => { setSelected(item); setName(item.internal_name ?? item.name ?? ''); setBasePrice(String(item.base_price ?? 0)); setCurrency(item.currency ?? 'USD'); setProductType(String(typeof item.type === 'object' && item.type !== null ? item.type.id : item.type ?? 1)); setDeliveryMethod('1'); setStep(0); setMessage('') }
  const basics = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setMessage('')
    const body = { internal_name: name.trim(), type: Number(productType), delivery_method: Number(deliveryMethod), base_price: Number(basePrice), currency: currency.toUpperCase(), vat_rule: 3, translations: { ar: { name: name.trim() } } }
    const result = selected ? await updateSellerProduct(selected.ulid, body) : await createSellerProduct(body)
    if (!result.ok) setMessage(result.message); else { setSelected(result.data); setStep(1); await load() }; setSaving(false)
  }
  const saveStep = async () => {
    if (!selected) return
    setSaving(true); let result
    if (step === 1) result = await saveSellerProductDescription(selected.ulid, { translations: { ar: { full_description: description } } })
    else if (step === 2) result = await saveSellerProductDelivery(selected.ulid, { external_url: deliveryUrl || null })
    else if (step === 3) result = await saveSellerProductSeo(selected.ulid, { translations: { ar: { meta_title: seoTitle } } })
    else result = await saveSellerProductFunnel(selected.ulid, JSON.parse(funnelJson) as unknown)
    if (!result.ok) setMessage(result.message); else { setMessage('Saved'); setStep(Math.min(4, step + 1)) }; setSaving(false)
  }
  const publish = async () => { if (!selected) return; setSaving(true); const result = await updateSellerProduct(selected.ulid, { status: 2 }); if (!result.ok) setMessage(result.message); else { setMessage('Product published'); await load(); setSelected(null) }; setSaving(false) }
  const remove = async (ulid: string) => { if (!window.confirm('Delete this product?')) return; const result = await deleteSellerProduct(ulid); if (!result.ok) setMessage(result.message); else await load() }

  if (selected || step > 0) return <section className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-semibold">{selected ? 'Edit product' : 'New product'}</h2><Button variant="outline" onClick={() => { setSelected(null); setStep(0) }}>Back to products</Button></div><div className="flex flex-wrap gap-2 text-sm">{['Basics', 'Description', 'Delivery', 'SEO', 'Funnel', 'Review'].map((label, index) => <span key={label} className={`rounded-full px-3 py-1 ${index === step ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>{index + 1}. {label}</span>)}</div>{message && <p role="alert" className="text-sm text-destructive">{message}</p>}{step === 0 && <form onSubmit={(event) => void basics(event)} className="grid max-w-2xl gap-3 rounded-lg border p-4"><Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Internal name" maxLength={200} required /><select value={productType} onChange={(event) => setProductType(event.target.value)} className="h-8 rounded-lg border bg-background px-2 text-sm">{types.map((label, index) => <option key={label} value={index + 1}>{label}</option>)}</select><select value={deliveryMethod} onChange={(event) => setDeliveryMethod(event.target.value)} className="h-8 rounded-lg border bg-background px-2 text-sm">{['File download', 'External link', 'Notion link', 'Interactive', 'Discord', 'Telegram', 'Calendly', 'Physical'].map((label, index) => <option key={label} value={index + 1}>{label}</option>)}</select><div className="flex gap-2"><Input type="number" min="0" step="0.01" value={basePrice} onChange={(event) => setBasePrice(event.target.value)} placeholder="Base price" required /><Input value={currency} onChange={(event) => setCurrency(event.target.value)} maxLength={3} placeholder="USD" required /></div><Button disabled={saving}>{saving ? 'Saving…' : 'Create / save basics'}</Button></form>}{step === 1 && <div className="max-w-2xl space-y-3"><Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Arabic full description" maxLength={10000} /><Button disabled={saving} onClick={() => void saveStep()}>Save description</Button></div>}{step === 2 && <div className="max-w-2xl space-y-3"><Input value={deliveryUrl} onChange={(event) => setDeliveryUrl(event.target.value)} placeholder="External delivery URL" /><Button disabled={saving} onClick={() => void saveStep()}>Save delivery</Button></div>}{step === 3 && <div className="max-w-2xl space-y-3"><Input value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} placeholder="Arabic SEO title" maxLength={160} /><Button disabled={saving} onClick={() => void saveStep()}>Save SEO</Button></div>}{step === 4 && <div className="max-w-2xl space-y-3"><Textarea value={funnelJson} onChange={(event) => setFunnelJson(event.target.value)} placeholder="Funnel JSON" /><Button disabled={saving} onClick={() => { try { void saveStep() } catch { setMessage('Funnel must be valid JSON') } }}>Save funnel</Button></div>}{step === 5 && <div className="rounded-lg border p-4"><p className="mb-3 text-sm text-muted-foreground">Review the saved product, then publish it to the storefront.</p><Button disabled={saving} onClick={() => void publish()}>Publish product</Button></div>}</section>

  return <section className="space-y-4"><div className="flex flex-wrap gap-2"><select aria-label="Status" value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)} className="h-8 rounded-lg border bg-background px-2 text-sm"><option value="">All statuses</option>{statuses.map((label, index) => <option key={label} value={index + 1}>{label}</option>)}</select><select aria-label="Type" value={filterType} onChange={(event) => setFilterType(event.target.value)} className="h-8 rounded-lg border bg-background px-2 text-sm"><option value="">All types</option>{types.map((label, index) => <option key={label} value={index + 1}>{label}</option>)}</select><Button onClick={startNew}>New product</Button><Button variant="outline" onClick={() => void load()}>Refresh</Button></div>{message && <p role="alert" className="text-sm text-destructive">{message}</p>}<div className="divide-y rounded-lg border">{items.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No products found.</p>}{items.map((item) => <div key={item.ulid} className="flex flex-wrap items-center justify-between gap-3 p-4"><button type="button" className="text-start" onClick={() => open(item)}><p className="font-medium">{item.name ?? item.internal_name ?? item.ulid}</p><p className="text-sm text-muted-foreground">{typeof item.status === 'object' && item.status !== null ? item.status.label : statuses[statusId(item.status) - 1]} · {item.base_price ?? '0'} {item.currency ?? ''}</p></button><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => void updateSellerProduct(item.ulid, { status: statusId(item.status) === 2 ? 1 : 2 }).then(load)}>{statusId(item.status) === 2 ? 'Archive' : 'Publish'}</Button><Button size="sm" variant="destructive" onClick={() => void remove(item.ulid)}>Delete</Button></div></div>)}</div></section>
}
