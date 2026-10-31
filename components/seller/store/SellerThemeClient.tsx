'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { activateSellerTheme, listSellerThemes, type SellerTheme } from '@/lib/seller/resource-client'

export function SellerThemeClient() { const [items, setItems] = useState<SellerTheme[]>([]); const [message, setMessage] = useState(''); const load = async () => { const r = await listSellerThemes('?per_page=15'); if (r.ok) setItems(r.data.items); else setMessage(r.message) }; useEffect(() => { void Promise.resolve().then(load) }, []); return <section className="space-y-4">{message && <p role="alert" className="text-sm text-destructive">{message}</p>}<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{items.map((theme) => <article key={theme.ulid} className="rounded-lg border p-4"><h2 className="font-medium">{theme.name ?? theme.slug ?? theme.ulid}</h2><p className="mt-1 text-sm text-muted-foreground">{theme.slug ?? 'Published theme'}</p><Button className="mt-4" onClick={() => void activateSellerTheme(theme.ulid).then((r) => { if (!r.ok) setMessage(r.message); else setMessage('Theme activated.') })}>Activate</Button></article>)}</div></section> }
