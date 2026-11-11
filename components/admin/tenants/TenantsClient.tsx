'use client'

import { useCallback, useEffect, useState } from 'react'
import { Database, PauseCircle, PlayCircle, PlusCircle, RefreshCw, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useTranslations } from 'next-intl'
import { sileo } from 'sileo'
import { adminOperationsApi } from '@/lib/admin/operations-client'
import { platformAdminApi, type PlatformSubscriber } from '@/lib/admin/platform-client'

interface TenantRow {
  ulid: string
  subscriber_id?: number | null
  db_name?: string | null
  db_host?: string | null
  db_port?: number | null
  status?: { id: number | string; label: string } | null
  provision_error?: string | null
  provisioned_at?: string | null
  suspended_at?: string | null
}

export function TenantsClient() {
  const t = useTranslations('tenant')
  const [tenants, setTenants] = useState<TenantRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [isCreate, setIsCreate] = useState(true)
  const [subscriberUlid, setSubscriberUlid] = useState('')
  const [subscribers, setSubscribers] = useState<PlatformSubscriber[]>([])
  const [provisioning, setProvisioning] = useState(false)
  const [busyUlid, setBusyUlid] = useState<string | null>(null)
  const [loadingSubscribers, setLoadingSubscribers] = useState(true)

  const loadTenants = useCallback(async () => {
    setLoading(true)
    setError('')
    const result = await adminOperationsApi.listTenants('?per_page=50')
    setLoading(false)
    if (!result.ok) {
      setError(result.message)
      return
    }
    setTenants((result.data ?? []) as TenantRow[])
  }, [])

  const loadSubscribers = useCallback(async () => {
    setLoadingSubscribers(true)
    const result = await platformAdminApi.listSubscribers()
    setLoadingSubscribers(false)
    if (!result.ok) {
      setError(result.message)
      return
    }
    setSubscribers(result.data ?? [])
  }, [])

  useEffect(() => {
    const tenantTimer = window.setTimeout(() => {
      void loadTenants()
    }, 0)
    const subscriberTimer = window.setTimeout(() => {
      void loadSubscribers()
    }, 0)
    return () => {
      window.clearTimeout(tenantTimer)
      window.clearTimeout(subscriberTimer)
    }
  }, [loadTenants, loadSubscribers])

  async function provision() {
    if (!subscriberUlid.trim()) {
      sileo.error({ title: 'Subscriber ULID is required' })
      return
    }
    setProvisioning(true)
    const result = await adminOperationsApi.provisionTenant(subscriberUlid.trim())
    setProvisioning(false)
    if (!result.ok) {
      sileo.error({ title: result.message || 'Could not provision tenant' })
      return
    }
    sileo.success({ title: 'Tenant provisioning started' })
    setSubscriberUlid('')
    await loadTenants()
  }

  async function suspend(tenant: TenantRow) {
    if (!window.confirm(`Suspend tenant "${tenant.db_name ?? tenant.ulid}"?`)) return
    setBusyUlid(tenant.ulid)
    const result = await adminOperationsApi.suspendTenant(tenant.ulid)
    setBusyUlid(null)
    if (!result.ok) {
      sileo.error({ title: result.message || 'Could not suspend tenant' })
      return
    }
    sileo.success({ title: 'Tenant suspended' })
    await loadTenants()
  }

  async function restore(tenant: TenantRow) {
    setBusyUlid(tenant.ulid)
    const result = await adminOperationsApi.restoreTenant(tenant.ulid)
    setBusyUlid(null)
    if (!result.ok) {
      sileo.error({ title: result.message || 'Could not restore tenant' })
      return
    }
    sileo.success({ title: 'Tenant restored' })
    await loadTenants()
  }

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={() => void loadTenants()}>
            <RefreshCw className="me-2 size-4" /> Retry
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PlusCircle className="size-4" /> Provision a tenant database
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-2">
          <div className="flex min-w-[260px] flex-1 flex-col gap-1.5">
            <Label htmlFor="subscriber-ulid">Subscriber</Label>
            <Select
              value={subscriberUlid}
              onValueChange={(value) => setSubscriberUlid(value ?? '')}
            >
              <SelectTrigger><SelectValue placeholder={t('selectSubscriber')} /></SelectTrigger>
              <SelectContent>
                {subscribers.length > 0
                  ? subscribers.map((sub) => (
                      <SelectItem
                        key={sub.ulid}
                        value={sub.ulid}
                      >
                        {sub.name || sub.email || sub.ulid}
                      </SelectItem>
                    ))
                  : (
                    <SelectItem disabled>{t('noSubscribers')}</SelectItem>
                  )}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => void provision()} disabled={provisioning}>
            <Database className="me-2 size-4" />
            {provisioning ? 'Provisioning…' : 'Provision'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tenants</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading tenants…</p>
          ) : tenants.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tenants found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Subscriber</TableHead>
                  <TableHead>Database</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Provisioned</TableHead>
                  <TableHead className="text-end">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => {
                  const suspended = Boolean(tenant.suspended_at)
                  return (
                    <TableRow key={tenant.ulid}>
                      <TableCell className="font-mono text-xs">{tenant.ulid}</TableCell>
                      <TableCell>
                        {tenant.subscriber_id ?? '—'}
                      </TableCell>
                      <TableCell>
                        <p className="font-mono text-xs">{tenant.db_name ?? '—'}</p>
                        <p className="text-xs text-muted-foreground">
                          {tenant.db_host ?? '—'}
                          {tenant.db_port ? `:${tenant.db_port}` : ''}
                        </p>
                        {tenant.provision_error && (
                          <p className="text-xs text-destructive">{tenant.provision_error}</p>
                        )}
                      </TableCell>
                      <TableCell>{tenant.status?.label ?? '—'}</TableCell>
                      <TableCell>{tenant.provisioned_at ? new Date(tenant.provisioned_at).toLocaleString() : '—'}</TableCell>
                      <TableCell className="text-end">
                        {suspended ? (
                          <Button size="sm" variant="outline" disabled={busyUlid === tenant.ulid} onClick={() => void restore(tenant)}>
                            <PlayCircle className="me-2 size-4" /> Restore
                          </Button>
                        ) : (
                          <Button size="sm" variant="destructive" disabled={busyUlid === tenant.ulid} onClick={() => void suspend(tenant)}>
                            <PauseCircle className="me-2 size-4" /> Suspend
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}