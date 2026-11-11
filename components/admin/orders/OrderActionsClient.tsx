'use client'

import { useState } from 'react'
import { CheckCircle2, FileText, PackageCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sileo } from 'sileo'
import { adminOrderApi, type ShippingAddressInput } from '@/lib/admin/endpoints'

const EMPTY_ADDRESS: ShippingAddressInput = {
  name: '',
  phone: '',
  address_line1: '',
  address_line2: '',
  city: '',
  country: '',
}

export function OrderActionsClient({ orderUlid }: { orderUlid: string }) {
  const [busy, setBusy] = useState<'cod' | 'invoice' | 'shipment' | null>(null)
  const [address, setAddress] = useState<ShippingAddressInput>(EMPTY_ADDRESS)

  async function confirmCod() {
    if (!window.confirm('Mark this order as paid (cash on delivery)?')) return
    setBusy('cod')
    const result = await adminOrderApi.confirmCod(orderUlid)
    setBusy(null)
    if (!result.ok) {
      sileo.error({ title: result.message || 'Could not confirm COD payment' })
      return
    }
    sileo.success({ title: 'Order marked as paid' })
  }

  async function openInvoice() {
    setBusy('invoice')
    const result = await adminOrderApi.invoice(orderUlid)
    setBusy(null)
    if (!result.ok) {
      sileo.error({ title: result.message || 'Could not load invoice' })
      return
    }
    if (result.data?.invoice_url) {
      window.open(result.data.invoice_url, '_blank', 'noopener,noreferrer')
    }
  }

  async function createShipment() {
    if (!address.name.trim() || !address.phone.trim() || !address.address_line1.trim() || !address.city.trim()) {
      sileo.error({ title: 'Name, phone, address line 1, and city are required' })
      return
    }
    setBusy('shipment')
    const result = await adminOrderApi.createShipment(orderUlid, {
      ...address,
      address_line2: address.address_line2?.trim() || null,
      country: address.country?.trim() || null,
    })
    setBusy(null)
    if (!result.ok) {
      sileo.error({ title: result.message || 'Could not create shipment' })
      return
    }
    sileo.success({ title: 'Shipment created' })
    setAddress(EMPTY_ADDRESS)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => void confirmCod()} disabled={busy !== null}>
          <CheckCircle2 className="me-2 size-4" />
          {busy === 'cod' ? 'Confirming…' : 'Confirm COD paid'}
        </Button>
        <Button variant="outline" onClick={() => void openInvoice()} disabled={busy !== null}>
          <FileText className="me-2 size-4" />
          {busy === 'invoice' ? 'Loading…' : 'Open invoice'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PackageCheck className="size-4" /> Create shipment
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ship-name">Recipient name</Label>
              <Input id="ship-name" value={address.name} onChange={(e) => setAddress((a) => ({ ...a, name: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ship-phone">Phone</Label>
              <Input id="ship-phone" dir="ltr" value={address.phone} onChange={(e) => setAddress((a) => ({ ...a, phone: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ship-address1">Address line 1</Label>
              <Input id="ship-address1" value={address.address_line1} onChange={(e) => setAddress((a) => ({ ...a, address_line1: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ship-address2">Address line 2 (optional)</Label>
              <Input id="ship-address2" value={address.address_line2 ?? ''} onChange={(e) => setAddress((a) => ({ ...a, address_line2: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ship-city">City</Label>
              <Input id="ship-city" value={address.city} onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ship-country">Country (optional)</Label>
              <Input id="ship-country" dir="ltr" value={address.country ?? ''} onChange={(e) => setAddress((a) => ({ ...a, country: e.target.value }))} />
            </div>
          </div>
          <div>
            <Button onClick={() => void createShipment()} disabled={busy !== null}>
              <PackageCheck className="me-2 size-4" />
              {busy === 'shipment' ? 'Creating…' : 'Create shipment'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
