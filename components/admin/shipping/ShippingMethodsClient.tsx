'use client'

import { useCallback, useEffect, useState } from 'react'
import { Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { sileo } from 'sileo'
import {
  adminShippingApi,
  type ShippingMethodInput,
} from '@/lib/admin/endpoints'

interface ShippingMethod {
  ulid: string
  name: string
  description?: string | null
  price: number | string
  estimated_days_min?: number | null
  estimated_days_max?: number | null
  is_active?: boolean
}

const EMPTY_FORM: ShippingMethodInput = {
  name: '',
  description: '',
  price: 0,
  estimated_days_min: null,
  estimated_days_max: null,
  is_active: true,
}

export function ShippingMethodsClient() {
  const [items, setItems] = useState<ShippingMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState<ShippingMethodInput>(EMPTY_FORM)
  const [editingUlid, setEditingUlid] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const result = await adminShippingApi.list()
    setLoading(false)
    if (!result.ok) {
      setError(result.message)
      return
    }
    setItems((result.data ?? []) as ShippingMethod[])
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  function resetForm() {
    setForm(EMPTY_FORM)
    setEditingUlid(null)
  }

  function startEdit(item: ShippingMethod) {
    setEditingUlid(item.ulid)
    setForm({
      name: item.name,
      description: item.description ?? '',
      price: Number(item.price),
      estimated_days_min: item.estimated_days_min ?? null,
      estimated_days_max: item.estimated_days_max ?? null,
      is_active: item.is_active ?? true,
    })
  }

  async function submit() {
    if (!form.name.trim()) {
      sileo.error({ title: 'Name is required' })
      return
    }
    setSaving(true)
    const body: ShippingMethodInput = {
      ...form,
      name: form.name.trim(),
      description: form.description?.trim() || null,
      price: Number(form.price),
    }
    const result = editingUlid
      ? await adminShippingApi.update(editingUlid, body)
      : await adminShippingApi.create(body)
    setSaving(false)

    if (!result.ok) {
      sileo.error({ title: result.message || 'Could not save shipping method' })
      return
    }
    sileo.success({ title: editingUlid ? 'Shipping method updated' : 'Shipping method created' })
    resetForm()
    await load()
  }

  async function remove(item: ShippingMethod) {
    if (!window.confirm(`Delete "${item.name}"?`)) return
    const result = await adminShippingApi.remove(item.ulid)
    if (!result.ok) {
      sileo.error({ title: result.message || 'Could not delete shipping method' })
      return
    }
    sileo.success({ title: 'Shipping method deleted' })
    await load()
  }

  async function toggle(item: ShippingMethod, active: boolean) {
    const result = await adminShippingApi.update(item.ulid, { is_active: active })
    if (!result.ok) {
      sileo.error({ title: result.message || 'Could not update shipping method' })
      return
    }
    await load()
  }

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RefreshCw className="me-2 size-4" /> Retry
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {editingUlid ? 'Edit shipping method' : 'Create shipping method'}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="shipping-name">Name</Label>
              <Input id="shipping-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Standard shipping" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="shipping-price">Price</Label>
              <Input id="shipping-price" type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="shipping-description">Description</Label>
              <Input id="shipping-description" value={form.description ?? ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="3-5 business days" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="shipping-min">Estimated days (min)</Label>
              <Input id="shipping-min" type="number" min="0" value={form.estimated_days_min ?? ''} onChange={(e) => setForm((f) => ({ ...f, estimated_days_min: e.target.value === '' ? null : Number(e.target.value) }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="shipping-max">Estimated days (max)</Label>
              <Input id="shipping-max" type="number" min="0" value={form.estimated_days_max ?? ''} onChange={(e) => setForm((f) => ({ ...f, estimated_days_max: e.target.value === '' ? null : Number(e.target.value) }))} />
            </div>
            <div className="flex items-center gap-3 pt-5">
              <Switch id="shipping-active" checked={form.is_active ?? true} onCheckedChange={(checked) => setForm((f) => ({ ...f, is_active: checked }))} />
              <Label htmlFor="shipping-active">Active</Label>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => void submit()} disabled={saving}>
              {editingUlid ? <Pencil className="me-2 size-4" /> : <Plus className="me-2 size-4" />}
              {saving ? 'Saving…' : editingUlid ? 'Save changes' : 'Create method'}
            </Button>
            {editingUlid && (
              <Button variant="outline" onClick={resetForm} disabled={saving}>
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Shipping methods</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading shipping methods…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No shipping methods yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Delivery estimate</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-end">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.ulid}>
                    <TableCell>
                      <p className="font-medium">{item.name}</p>
                      {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                    </TableCell>
                    <TableCell>{item.price}</TableCell>
                    <TableCell>
                      {item.estimated_days_min ?? '—'} – {item.estimated_days_max ?? '—'} days
                    </TableCell>
                    <TableCell>
                      <Switch checked={item.is_active ?? true} onCheckedChange={(checked) => void toggle(item, checked)} />
                    </TableCell>
                    <TableCell className="text-end">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => startEdit(item)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => void remove(item)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
