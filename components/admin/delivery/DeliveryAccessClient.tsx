'use client'

import { useCallback, useState } from 'react'
import { KeyRound, RefreshCw, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { sileo } from 'sileo'
import { adminDeliveryApi } from '@/lib/admin/endpoints'

interface AccessRow {
  customer_ulid: string
  granted_at?: string | null
  expires_at?: string | null
  source?: string | null
}

export function DeliveryAccessClient() {
  const [productUlid, setProductUlid] = useState('')
  const [rows, setRows] = useState<AccessRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [grantCustomer, setGrantCustomer] = useState('')
  const [grantProduct, setGrantProduct] = useState('')
  const [grantExpires, setGrantExpires] = useState('')
  const [granting, setGranting] = useState(false)

  const load = useCallback(async (ulid = productUlid) => {
    const value = ulid.trim()
    if (!value) return
    setLoading(true)
    setError('')
    const result = await adminDeliveryApi.access(value)
    setLoading(false)
    if (!result.ok) {
      setError(result.message)
      setRows([])
      return
    }
    setRows((result.data ?? []) as AccessRow[])
  }, [productUlid])

  async function grant() {
    if (!grantCustomer.trim() || !grantProduct.trim()) {
      sileo.error({ title: 'Customer ULID and product ULID are required' })
      return
    }
    setGranting(true)
    const result = await adminDeliveryApi.grant({
      customer_ulid: grantCustomer.trim(),
      product_ulid: grantProduct.trim(),
      expires_at: grantExpires ? new Date(grantExpires).toISOString() : null,
    })
    setGranting(false)

    if (!result.ok) {
      sileo.error({ title: result.message || 'Could not grant access' })
      return
    }
    sileo.success({ title: 'Access granted' })
    setGrantCustomer('')
    setGrantExpires('')
    if (grantProduct.trim() === productUlid.trim()) await load(grantProduct)
  }

  async function revoke(row: AccessRow) {
    if (!productUlid.trim()) return
    if (!window.confirm(`Revoke access for ${row.customer_ulid}?`)) return
    const result = await adminDeliveryApi.revoke(row.customer_ulid, productUlid.trim())
    if (!result.ok) {
      sileo.error({ title: result.message || 'Could not revoke access' })
      return
    }
    sileo.success({ title: 'Access revoked' })
    await load()
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="size-4" /> Inspect product access
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex min-w-[260px] flex-1 flex-col gap-1.5">
              <Label htmlFor="access-product">Product ULID</Label>
              <Input id="access-product" dir="ltr" value={productUlid} onChange={(e) => setProductUlid(e.target.value)} placeholder="01K…" />
            </div>
            <Button onClick={() => void load()} disabled={loading || !productUlid.trim()}>
              <Search className="me-2 size-4" />
              {loading ? 'Loading…' : 'Load access'}
            </Button>
          </div>

          {error && (
            <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={() => void load()}>
                <RefreshCw className="me-2 size-4" /> Retry
              </Button>
            </div>
          )}

          {rows.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer ULID</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Granted</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-end">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.customer_ulid}>
                    <TableCell className="font-mono text-xs">{row.customer_ulid}</TableCell>
                    <TableCell>{row.source ?? '—'}</TableCell>
                    <TableCell>{row.granted_at ? new Date(row.granted_at).toLocaleString() : '—'}</TableCell>
                    <TableCell>{row.expires_at ? new Date(row.expires_at).toLocaleString() : 'Never'}</TableCell>
                    <TableCell className="text-end">
                      <Button size="sm" variant="destructive" onClick={() => void revoke(row)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!loading && !error && rows.length === 0 && productUlid.trim() && (
            <p className="text-sm text-muted-foreground">No customers currently have access.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="size-4" /> Grant access manually
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="grant-customer">Customer ULID</Label>
              <Input id="grant-customer" dir="ltr" value={grantCustomer} onChange={(e) => setGrantCustomer(e.target.value)} placeholder="01K…" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="grant-product">Product ULID</Label>
              <Input id="grant-product" dir="ltr" value={grantProduct} onChange={(e) => setGrantProduct(e.target.value)} placeholder="01K…" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="grant-expires">Expires at (optional)</Label>
              <Input id="grant-expires" type="datetime-local" value={grantExpires} onChange={(e) => setGrantExpires(e.target.value)} />
            </div>
          </div>
          <div>
            <Button onClick={() => void grant()} disabled={granting}>
              <KeyRound className="me-2 size-4" />
              {granting ? 'Granting…' : 'Grant access'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
