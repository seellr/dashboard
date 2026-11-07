'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, Shield, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { platformAdminApi, type PlatformAdmin, type PlatformPlan, type PlatformSubscriber } from '@/lib/admin/platform-client'

export function PlatformManagementClient({ locale = 'ar' }: { locale?: string }) {
  const [admins, setAdmins] = useState<PlatformAdmin[]>([]); const [subscribers, setSubscribers] = useState<PlatformSubscriber[]>([]); const [plans, setPlans] = useState<PlatformPlan[]>([]); const [error, setError] = useState(''); const [loading, setLoading] = useState(true)
  async function load() { setLoading(true); setError(''); const [a, s, p] = await Promise.all([platformAdminApi.listAdmins(), platformAdminApi.listSubscribers(), platformAdminApi.listPlans()]); if (!a.ok || !s.ok || !p.ok) setError(!a.ok ? a.message : !s.ok ? s.message : !p.ok ? p.message : 'Request failed'); if (a.ok) setAdmins(a.data ?? []); if (s.ok) setSubscribers(s.data ?? []); if (p.ok) setPlans(p.data ?? []); setLoading(false) }
  useEffect(() => { void load() }, [])
  if (loading) return <p className="text-sm text-muted-foreground">Loading platform data…</p>
  return <div className="space-y-6">{error && <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"><span>{error}</span><Button variant="outline" size="sm" onClick={() => void load()}><RefreshCw className="me-2 size-4" />Retry</Button></div>}<div className="grid gap-4 md:grid-cols-3"><Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Shield className="size-4" />Admins</CardTitle></CardHeader><CardContent className="text-3xl font-semibold">{admins.length}</CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Users className="size-4" />Subscribers</CardTitle></CardHeader><CardContent className="text-3xl font-semibold">{subscribers.length}</CardContent></Card><Card><CardHeader><CardTitle className="text-base">Plans</CardTitle></CardHeader><CardContent className="text-3xl font-semibold">{plans.length}</CardContent></Card></div><Card><CardHeader><CardTitle>Subscriber accounts</CardTitle></CardHeader><CardContent><div className="divide-y">{subscribers.map((subscriber) => <div key={subscriber.ulid} className="flex items-center justify-between gap-4 py-3 text-sm"><div><p className="font-medium">{subscriber.name ?? subscriber.email ?? subscriber.ulid}</p><p className="text-muted-foreground">{subscriber.status?.label ?? '—'}</p></div><Button variant="outline" size="sm" onClick={async () => { const result = await platformAdminApi.impersonateSubscriber(subscriber.ulid); if (result.ok) window.location.assign(`/${locale}/seller`) }}>{'Impersonate'}</Button></div>)}</div></CardContent></Card></div>
}
