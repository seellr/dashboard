'use client'
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export type MediaPickerScope = 'admin' | 'subscriber'
export interface PickedMedia { ulid: string; url: string; name?: string | null; thumb_url?: string | null }
interface Props { open: boolean; onOpenChange: (open: boolean) => void; onSelect: (media: PickedMedia | PickedMedia[]) => void; scope: MediaPickerScope; multiple?: boolean }

async function read<T>(scope: MediaPickerScope, path: string, init?: RequestInit): Promise<T> {
  const brandId = scope === 'admin' && typeof window !== 'undefined' ? window.localStorage.getItem('admin_active_brand_id') ?? '1' : undefined
  const response = await fetch(`/api/${scope === 'subscriber' ? 'subscriber' : 'admin'}${path}`, { ...init, headers: { Accept: 'application/json', ...(brandId ? { 'x-brand-id': brandId } : {}), ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...(init?.headers ?? {}) } })
  const text = await response.text(); const payload = text ? JSON.parse(text) as { success?: boolean; data?: T; message?: string } : {}
  if (!response.ok || payload.success === false) throw new Error(payload.message ?? 'Media request failed')
  return (payload.data ?? null) as T
}

export function MediaPickerDialog({ open, onOpenChange, onSelect, scope, multiple = false }: Props) {
  const [items, setItems] = useState<PickedMedia[]>([]); const [selected, setSelected] = useState<PickedMedia[]>([]); const [error, setError] = useState(''); const input = useRef<HTMLInputElement>(null)
  const load = async () => { try { setItems(await read<PickedMedia[]>(scope, '/media?per_page=40')) } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to load media') } }
  useEffect(() => { if (open) void Promise.resolve().then(load) }, [open])
  const upload = async (file: File) => { const form = new FormData(); form.append('file', file); try { onSelect(await read<PickedMedia>(scope, '/media/upload', { method: 'POST', body: form })); onOpenChange(false) } catch (caught) { setError(caught instanceof Error ? caught.message : 'Upload failed') } }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>Choose media</DialogTitle></DialogHeader><div className="flex items-center justify-between gap-2"><Button type="button" onClick={() => input.current?.click()}>Upload</Button><input ref={input} className="sr-only" type="file" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file) }} />{error && <p role="alert" className="text-sm text-destructive">{error}</p>}</div><div className="grid max-h-[55vh] grid-cols-2 gap-3 overflow-auto sm:grid-cols-4">{items.map((item) => <button type="button" key={item.ulid} className={`overflow-hidden rounded-lg border text-start ${selected.some((entry) => entry.ulid === item.ulid) ? 'ring-2 ring-primary' : ''}`} onClick={() => setSelected((current) => multiple ? current.some((entry) => entry.ulid === item.ulid) ? current.filter((entry) => entry.ulid !== item.ulid) : [...current, item] : [item])}>{item.thumb_url || item.url ? <img src={item.thumb_url ?? item.url} alt={item.name ?? ''} className="aspect-video w-full object-cover" /> : <div className="aspect-video bg-muted" />}<span className="block truncate p-2 text-xs">{item.name ?? item.ulid}</span></button>)}</div><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button disabled={selected.length === 0} onClick={() => { onSelect(multiple ? selected : selected[0]); setSelected([]); onOpenChange(false) }}>Select</Button></div></DialogContent></Dialog>
}
