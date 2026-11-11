'use client'

import { useCallback, useEffect, useState } from 'react'
import { Globe, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { adminOperationsApi } from '@/lib/admin/operations-client'

interface DomainRow {
  ulid: string
  domain: string
  verified?: boolean
  is_primary?: boolean
  tenant_ulid?: string | null
  created_at?: string | null
}

export function DomainsClient() {
  const [domains, setDomains] = useState<DomainRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const result = await adminOperationsApi.listDomains('?per_page=50')
    setLoading(false)
    if (!result.ok) {
      setError(result.message)
      return
    }
    setDomains((result.data ?? []) as DomainRow[])
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <Globe className="size-4" /> All subscriber domains
        </CardTitle>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className="me-2 size-4" /> Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={() => void load()}>Retry</Button>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading domains…</p>
        ) : domains.length === 0 ? (
          <p className="text-sm text-muted-foreground">No domains have been added yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Domain</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Primary</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {domains.map((domain) => (
                <TableRow key={domain.ulid}>
                  <TableCell className="font-medium" dir="ltr">{domain.domain}</TableCell>
                  <TableCell>{domain.verified ? '✓' : '—'}</TableCell>
                  <TableCell>{domain.is_primary ? '✓' : '—'}</TableCell>
                  <TableCell className="font-mono text-xs">{domain.tenant_ulid ?? '—'}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs">
                    {domain.created_at ? new Date(domain.created_at).toLocaleString() : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
