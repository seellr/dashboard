'use client'

import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, ScrollText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { adminOperationsApi } from '@/lib/admin/operations-client'

interface AuditLogRow {
  id: number | string
  actor_type?: string | null
  actor_id?: number | string | null
  impersonated_as?: string | null
  action?: string | null
  target_type?: string | null
  target_id?: number | string | null
  metadata?: Record<string, unknown> | null
  created_at?: string | null
}

interface ActivityLogRow {
  id: number | string
  event?: string | null
  description?: string | null
  causer_type?: string | null
  causer_id?: number | string | null
  subject_type?: string | null
  subject_id?: number | string | null
  properties?: Record<string, unknown> | null
  created_at?: string | null
}

const PAGE_SIZE = 50

export function AuditLogsClient() {
  const [tab, setTab] = useState<'audit' | 'activity'>('audit')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [term, setTerm] = useState('')
  const [rows, setRows] = useState<Array<AuditLogRow | ActivityLogRow>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async (kind: 'audit' | 'activity') => {
    setLoading(true)
    setError('')
    const query = new URLSearchParams({ per_page: String(PAGE_SIZE) })
    if (dateFrom) query.set('date_from', dateFrom)
    if (dateTo) query.set('date_to', dateTo)
    if (term.trim()) query.set(kind === 'audit' ? 'action' : 'event', term.trim())
    const suffix = `?${query.toString()}`

    const result =
      kind === 'audit'
        ? await adminOperationsApi.listAuditLogs(suffix)
        : await adminOperationsApi.listActivityLogs(suffix)

    setLoading(false)
    if (!result.ok) {
      setError(result.message)
      setRows([])
      return
    }
    setRows((result.data ?? []) as Array<AuditLogRow | ActivityLogRow>)
  }, [dateFrom, dateTo, term])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load(tab)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [load, tab])

  return (
    <div className="flex flex-col gap-6">
      <Tabs value={tab} onValueChange={(value) => setTab(value as 'audit' | 'activity')}>
        <TabsList>
          <TabsTrigger value="audit">Audit logs</TabsTrigger>
          <TabsTrigger value="activity">Activity logs</TabsTrigger>
        </TabsList>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ScrollText className="size-4" /> Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="logs-from">From</Label>
                <Input id="logs-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="logs-to">To</Label>
                <Input id="logs-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="logs-term">{tab === 'audit' ? 'Action' : 'Event'}</Label>
                <Input id="logs-term" value={term} onChange={(e) => setTerm(e.target.value)} placeholder={tab === 'audit' ? 'product.update' : 'updated'} />
              </div>
              <div className="flex items-end">
                <Button onClick={() => void load(tab)} disabled={loading}>
                  <RefreshCw className="me-2 size-4" />
                  {loading ? 'Loading…' : 'Refresh'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="mt-4 flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={() => void load(tab)}>
              <RefreshCw className="me-2 size-4" /> Retry
            </Button>
          </div>
        )}

        <TabsContent value="audit" className="mt-4">
          {renderAudit(rows as AuditLogRow[], loading)}
        </TabsContent>
        <TabsContent value="activity" className="mt-4">
          {renderActivity(rows as ActivityLogRow[], loading)}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function renderAudit(rows: AuditLogRow[], loading: boolean) {
  if (loading) return <p className="text-sm text-muted-foreground">Loading audit logs…</p>
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">No audit log entries found.</p>
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>When</TableHead>
          <TableHead>Actor</TableHead>
          <TableHead>Action</TableHead>
          <TableHead>Target</TableHead>
          <TableHead>Metadata</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="whitespace-nowrap text-xs">{row.created_at ? new Date(row.created_at).toLocaleString() : '—'}</TableCell>
            <TableCell className="text-xs">
              {row.actor_type ?? '—'} {row.actor_id ?? ''}
              {row.impersonated_as && <span className="block text-muted-foreground">as {row.impersonated_as}</span>}
            </TableCell>
            <TableCell className="font-mono text-xs">{row.action ?? '—'}</TableCell>
            <TableCell className="text-xs">
              {row.target_type ?? '—'} {row.target_id ?? ''}
            </TableCell>
            <TableCell className="max-w-[320px] truncate font-mono text-xs" title={row.metadata ? JSON.stringify(row.metadata) : ''}>
              {row.metadata ? JSON.stringify(row.metadata) : '—'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function renderActivity(rows: ActivityLogRow[], loading: boolean) {
  if (loading) return <p className="text-sm text-muted-foreground">Loading activity logs…</p>
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">No activity log entries found.</p>
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>When</TableHead>
          <TableHead>Event</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Causer</TableHead>
          <TableHead>Subject</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="whitespace-nowrap text-xs">{row.created_at ? new Date(row.created_at).toLocaleString() : '—'}</TableCell>
            <TableCell className="font-mono text-xs">{row.event ?? '—'}</TableCell>
            <TableCell className="max-w-[360px] text-sm">{row.description ?? '—'}</TableCell>
            <TableCell className="text-xs">
              {row.causer_type ?? '—'} {row.causer_id ?? ''}
            </TableCell>
            <TableCell className="text-xs">
              {row.subject_type ?? '—'} {row.subject_id ?? ''}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
