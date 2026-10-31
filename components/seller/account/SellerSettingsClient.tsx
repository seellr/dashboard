'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { sellerFetchClient } from '@/lib/seller/api-client'

interface SellerAccount { first_name?: string | null; last_name?: string | null; email?: string | null; phone?: string | null; plan_status?: number | null; email_verified?: boolean }

export function SellerSettingsClient() {
  const [account, setAccount] = useState<SellerAccount | null>(null); const [message, setMessage] = useState('')
  useEffect(() => { const timer = window.setTimeout(() => { void sellerFetchClient<{ user: SellerAccount }>('/auth/me').then((result) => { if (result.ok) setAccount(result.data.user); else setMessage(result.message) }) }, 0); return () => window.clearTimeout(timer) }, [])
  if (message) return <p role="alert" className="text-sm text-destructive">{message}</p>
  if (!account) return <p className="text-sm text-muted-foreground">Loading account…</p>
  return <div className="max-w-xl space-y-4 rounded-lg border p-5"><div><h2 className="font-semibold">{account.first_name ?? ''} {account.last_name ?? ''}</h2><p className="text-sm text-muted-foreground">{account.email ?? '—'}</p></div><dl className="grid gap-3 text-sm"><div><dt className="font-medium">Phone</dt><dd className="text-muted-foreground">{account.phone ?? '—'}</dd></div><div><dt className="font-medium">Email verification</dt><dd className="text-muted-foreground">{account.email_verified ? 'Verified' : 'Not verified'}</dd></div><div><dt className="font-medium">Plan status</dt><dd className="text-muted-foreground">{account.plan_status ?? '—'}</dd></div></dl><Button variant="outline" onClick={() => { void fetch('/api/subscriber/auth/logout', { method: 'POST' }).then(() => { window.location.href = '/seller/login' }) }}>Log out</Button></div>
}
