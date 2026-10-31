'use client'
/* eslint-disable @next/next/no-img-element */

import { ChangeEvent, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { bulkDeleteSellerMedia, deleteSellerMedia, listSellerMedia, listSellerMediaFolders, updateSellerMedia, uploadSellerMediaMultiple, uploadSellerMedia, type SellerMedia } from '@/lib/seller/resource-client'

export function SellerMediaClient() {
  const [items, setItems] = useState<SellerMedia[]>([])
  const [folders, setFolders] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [folder, setFolder] = useState('')
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [editing, setEditing] = useState<SellerMedia | null>(null)
  const [editName, setEditName] = useState('')
  const [editAlt, setEditAlt] = useState('')
  const input = useRef<HTMLInputElement>(null)

  const load = async (append = false) => {
    const params = new URLSearchParams({ per_page: '15' })
    if (search.trim()) params.set('search', search.trim())
    if (folder) params.set('folder', folder)
    if (append && cursor) params.set('cursor', cursor)
    const result = await listSellerMedia(`?${params.toString()}`)
    if (!result.ok) { setMessage(result.message); return }
    setItems((previous) => append ? [...previous, ...result.data.items] : result.data.items)
    setCursor(result.data.meta?.next_cursor ?? null)
    setHasMore(result.data.meta?.has_more === true)
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void Promise.all([load(), listSellerMediaFolders().then((result) => { if (result.ok) setFolders(result.data) })]) }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0) return
    if (files.length > 20) { setMessage('You can upload up to 20 files at once.'); return }
    if (files.some((file) => file.size > 20 * 1024 * 1024)) { setMessage('Each file must be 20MB or smaller.'); return }
    let result
    if (files.length === 1) { const form = new FormData(); form.append('file', files[0]); if (folder) form.append('folder', folder); result = await uploadSellerMedia(form) }
    else result = await uploadSellerMediaMultiple(files, folder || undefined)
    if (!result.ok) setMessage(result.message); else await load()
    if (input.current) input.current.value = ''
  }

  const removeSelected = async () => {
    if (selected.length === 0 || !window.confirm(`Delete ${selected.length} file(s)?`)) return
    const result = await bulkDeleteSellerMedia(selected)
    if (!result.ok) setMessage(result.message); else { setSelected([]); await load() }
  }

  const saveDetails = async () => {
    if (!editing) return
    const result = await updateSellerMedia(editing.ulid, { name: editName, alt_text: editAlt || null, folder: editing.folder })
    if (!result.ok) setMessage(result.message); else { setEditing(null); await load() }
  }

  return <section className="space-y-4">
    <div className="flex flex-wrap gap-2"><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search files" className="max-w-xs" onKeyDown={(event) => { if (event.key === 'Enter') { setCursor(null); void load() } }} /><select aria-label="Folder" value={folder} onChange={(event) => { setFolder(event.target.value); setCursor(null); void load() }} className="h-8 rounded-lg border bg-background px-2 text-sm"><option value="">All folders</option>{folders.map((value) => <option key={value} value={value}>{value}</option>)}</select><input ref={input} type="file" multiple className="sr-only" onChange={(event) => void upload(event)} /><Button onClick={() => input.current?.click()}>Upload</Button><Button variant="outline" disabled={selected.length === 0} onClick={() => void removeSelected()}>Delete selected</Button><Button variant="outline" onClick={() => { setCursor(null); void load() }}>Refresh</Button></div>
    {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{items.map((item) => <article key={item.ulid} className="overflow-hidden rounded-lg border"><button type="button" className="block w-full text-start" onClick={() => setSelected((current) => current.includes(item.ulid) ? current.filter((id) => id !== item.ulid) : [...current, item.ulid])}>{item.thumb_url || item.url ? <img src={item.thumb_url ?? item.url ?? ''} alt={item.name ?? item.original_name ?? ''} className="aspect-video w-full object-cover" /> : <div className="aspect-video bg-muted" />}<div className="flex items-center gap-2 p-3"><input type="checkbox" readOnly checked={selected.includes(item.ulid)} aria-label={`Select ${item.name ?? 'file'}`} /><span className="truncate text-sm">{item.name ?? item.original_name}</span></div></button><div className="flex gap-2 border-t p-2"><Button size="sm" variant="outline" onClick={() => { setEditing(item); setEditName(item.name ?? ''); setEditAlt(item.alt_text ?? '') }}>Details</Button><Button size="sm" variant="destructive" onClick={() => { if (window.confirm('Delete this file?')) void deleteSellerMedia(item.ulid).then((result) => { if (!result.ok) setMessage(result.message); else void load() }) }}>Delete</Button></div></article>)}</div>
    {items.length === 0 && <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No media found.</p>}{hasMore && <Button variant="outline" onClick={() => void load(true)}>Load more</Button>}
    {editing && <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div className="w-full max-w-md space-y-4 rounded-xl bg-background p-6 shadow-xl"><h2 className="text-lg font-semibold">File details</h2><Input value={editName} onChange={(event) => setEditName(event.target.value)} placeholder="Name" maxLength={200} /><Input value={editAlt} onChange={(event) => setEditAlt(event.target.value)} placeholder="Alt text" maxLength={500} /><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={() => void saveDetails()}>Save</Button></div></div></div>}
  </section>
}
