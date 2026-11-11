'use client'

import { useCallback, useEffect, useState } from 'react'
import { CreditCard, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useTranslations } from 'next-intl'
import { sileo } from 'sileo'
import { platformAdminApi, type PlatformPlan } from '@/lib/admin/platform-client'

const STATUS_LABELS: Record<string, string> = { 'true': 'Active', 'false': 'Suspended' }

interface PlanForm {
  price_monthly: number
  price_annual: number
  max_sites: string
  max_products: string
  trial_days: string
  active: string
  nameAr: string
  nameEn: string
}

const EMPTY_FORM: PlanForm = {
  price_monthly: 0,
  price_annual: 0,
  max_sites: '',
  max_products: '',
  trial_days: '',
  active: 'true',
  nameAr: '',
  nameEn: '',
}

export function PlansClient() {
  const t = useTranslations('plan')
  const [plans, setPlans] = useState<PlatformPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState<PlanForm>(EMPTY_FORM)
  const [editingUlid, setEditingUlid] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [isCreate, setIsCreate] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const result = await platformAdminApi.listPlans()
    setLoading(false)
    if (!result.ok) {
      setError(result.message)
      return
    }
    setPlans(result.data ?? [])
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
    setIsCreate(true)
    setShowDialog(false)
  }

  function startCreate() {
    setIsCreate(true)
    setForm(EMPTY_FORM)
    setShowDialog(true)
  }

  function startEdit(plan: PlatformPlan) {
    setIsCreate(false)
    setEditingUlid(plan.ulid)
    setForm({
      price_monthly: Number(plan.price_monthly ?? plan.price ?? 0),
      price_annual: Number(plan.price_annual ?? 0),
      max_sites: plan.max_sites === null || plan.max_sites === undefined ? '' : String(plan.max_sites),
      max_products: plan.max_products === null || plan.max_products === undefined ? '' : String(plan.max_products),
      trial_days: plan.trial_days === null || plan.trial_days === undefined ? '' : String(plan.trial_days),
      active: plan.active === false ? 'false' : 'true',
      nameAr: plan.name ?? '',
      nameEn: plan.name ?? '',
    })
    setShowDialog(true)
  }

  async function submit() {
    setSaving(true)
    if (isCreate) {
      const body = {
        price_monthly: Number(form.price_monthly),
        price_annual: Number(form.price_annual),
        max_sites: form.max_sites.trim() || undefined,
        max_products: form.max_products.trim() || undefined,
        trial_days: form.trial_days.trim() || undefined,
        active: form.active === 'true',
        translations: {
          ar: { name: form.nameAr.trim() },
          en: { name: form.nameEn.trim() },
        },
      }
      const result = await platformAdminApi.createPlan(body)
      if (!result.ok) {
        sileo.error({ title: result.message || 'Could not create plan' })
        setSaving(false)
        return
      }
      sileo.success({ title: 'Plan created' })
    } else {
      const body: Record<string, unknown> = {
        price_monthly: Number(form.price_monthly),
        price_annual: Number(form.price_annual),
        max_sites: form.max_sites.trim() || undefined,
        max_products: form.max_products.trim() || undefined,
        trial_days: form.trial_days.trim() || undefined,
        active: form.active === 'true',
        translations: {
          ar: { name: form.nameAr.trim() },
          en: { name: form.nameEn.trim() },
        },
      }
      const result = await platformAdminApi.updatePlan(editingUlid!, body)
      if (!result.ok) {
        sileo.error({ title: result.message || 'Could not update plan' })
        setSaving(false)
        return
      }
      sileo.success({ title: 'Plan updated' })
    }
    resetForm()
    await load()
  }

  async function remove(plan: PlatformPlan) {
    if (!window.confirm(`Delete plan "${plan.name ?? plan.ulid}"?`)) return
    const result = await platformAdminApi.deletePlan(plan.ulid)
    if (!result.ok) {
      sileo.error({ title: result.message || 'Could not delete plan' })
      return
    }
    sileo.success({ title: 'Plan deleted' })
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
          <CardTitle className="flex items-center gap-2 text-base">
            {isCreate ? <Plus className="size-4" /> : <Pencil className="size-4" />}
            {isCreate ? t('createPlan') : t('editPlan')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {showDialog && (
            <Dialog open={showDialog} onOpenChange={() => setShowDialog(false)}>
              <DialogHeader>
                <DialogTitle>{isCreate ? t('createPlan') : t('editPlan')}</DialogTitle>
                <DialogDescription>{isCreate ? t('fillFormToCreatePlan') : t('fillFormToEditPlan')}</DialogDescription>
              </DialogHeader>
              <DialogContent className="px-4 pb-2">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="plan-name-ar">Name (Arabic)</Label>
                    <Input id="plan-name-ar" dir="rtl" value={form.nameAr} onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="plan-name-en">Name (English)</Label>
                    <Input id="plan-name-en" value={form.nameEn} onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="plan-monthly">Monthly price</Label>
                    <Input id="plan-monthly" type="number" min="0" step="0.01" value={form.price_monthly} onChange={(e) => setForm((f) => ({ ...f, price_monthly: Number(e.target.value) }))} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="plan-annual">Annual price</Label>
                    <Input id="plan-annual" type="number" min="0" step="0.01" value={form.price_annual} onChange={(e) => setForm((f) => ({ ...f, price_annual: Number(e.target.value) }))} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="plan-sites">Max sites</Label>
                    <Input id="plan-sites" type="number" min="0" value={form.max_sites} onChange={(e) => setForm((f) => ({ ...f, max_sites: e.target.value }))} placeholder="Unlimited" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="plan-products">Max products</Label>
                    <Input id="plan-products" type="number" min="0" value={form.max_products} onChange={(e) => setForm((f) => ({ ...f, max_products: e.target.value }))} placeholder="Unlimited" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="plan-trial">Trial days</Label>
                    <Input id="plan-trial" type="number" min="0" value={form.trial_days} onChange={(e) => setForm((f) => ({ ...f, trial_days: e.target.value }))} placeholder="None" />
                  </div>
                  <div className="flex items-center gap-3 pt-5">
                    <Switch id="plan-active" checked={form.active === 'true'} onCheckedChange={(checked) => setForm((f) => ({ ...f, active: checked ? 'true' : 'false' }))} />
                    <Label htmlFor="plan-active">Active</Label>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button disabled={saving}>
                    {saving ? 'Saving…' : isCreate ? t('create') : t('saveChanges')}
                  </Button>
                  {!isCreate && (
                    <Button variant="outline" onClick={resetForm} disabled={saving}>
                      {t('cancel')}
                    </Button>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}

          {!showDialog && (
            <div>
              <Button onClick={() => startCreate()}>{t('createPlan')}</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plans</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading plans…</p>
          ) : plans.length === 0 ? (
            <p className="text-sm text-muted-foreground">No plans yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Monthly</TableHead>
                  <TableHead>Annual</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-end">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.ulid}>
                    <TableCell className="font-medium">{plan.name ?? plan.ulid}</TableCell>
                    <TableCell className="font-mono text-xs">{plan.slug ?? '—'}</TableCell>
                    <TableCell>{plan.price_monthly ?? plan.price ?? '—'}</TableCell>
                    <TableCell>{plan.price_annual ?? '—'}</TableCell>
                    <TableCell>{plan.active === false ? 'Suspended' : 'Active'}</TableCell>
                    <TableCell className="text-end">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(plan)}
                        >
                          <Pencil className="size-4" />
                          {t('edit')}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => remove(plan)}
                        >
                          <Trash2 className="size-4" />
                          {t('delete')}
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