'use client'

import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, Pencil, Plus, RefreshCw, Shield, Trash2, UserPlus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useTranslations } from 'next-intl'
import { sileo } from 'sileo'
import { platformAdminApi, type PlatformAdmin } from '@/lib/admin/platform-client'

const STATUS_LABELS: Record<number, string> = { 1: 'Pending', 2: 'Active', 3: 'Suspended' }

interface AdminForm {
  first_name: string
  last_name: string
  email: string
  password: string
  password_confirmation: string
  role: string
}

const EMPTY_FORM: AdminForm = {
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  password_confirmation: '',
  role: 'content_manager',
}

function statusId(admin: PlatformAdmin): number | undefined {
  const status = admin.status
  if (typeof status === 'number') return status
  if (status && typeof status === 'object') {
    const id = Number(status.id)
    return Number.isFinite(id) ? id : undefined
  }
  return undefined
}

function roleList(admin: PlatformAdmin): { name: string; label?: string }[] {
  return (admin.roles ?? []).map((role) => {
    if (typeof role === 'string') return { name: role }
    if (typeof role === 'object' && role !== null) {
      return { name: role.name ?? role.label ?? String(role.id), label: role.label }
    }
    return { name: String(role) }
  })
}

function normalizeRoles(raw: unknown): { name: string; permissions?: string[] }[] {
  if (Array.isArray(raw)) {
    return raw.map((r) => {
      if (typeof r === 'string') return { name: r }
      if (typeof r === 'object' && r !== null && 'name' in r) return { name: String(r.name) }
      return { name: String(r) }
    })
  }
  return []
}

export function AdminsClient() {
  const t = useTranslations('admin')
  const [admins, setAdmins] = useState<PlatformAdmin[]>([])
  const [roles, setRoles] = useState<{ name: string; permissions?: string[] }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState<AdminForm>(EMPTY_FORM)
  const [editingUlid, setEditingUlid] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [roleDrafts, setRoleDrafts] = useState<Record<string, string>>({})
  const [showDialog, setShowDialog] = useState(false)
  const [isCreate, setIsCreate] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const [adminsResult, rolesResult] = await Promise.all([
      platformAdminApi.listAdmins(),
      platformAdminApi.listRoles(),
    ])
    setLoading(false)
    if (adminsResult.ok) setAdmins(adminsResult.data ?? [])
    if (rolesResult.ok) setRoles(normalizeRoles(rolesResult.data))
    if (!adminsResult.ok) setError(adminsResult.message)
    else if (!rolesResult.ok) setError(rolesResult.message)
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

  function startEdit(admin: PlatformAdmin) {
    const defaultRole = roles[0]?.name ?? 'content_manager'
    const matchedRole = roles.find(
      (r) =>
        admin.roles &&
        typeof admin.roles[0] === 'string' &&
        r.name === admin.roles[0]
    )?.name ?? defaultRole
    setIsCreate(false)
    setEditingUlid(admin.ulid)
    setForm({
      first_name: admin.first_name ?? '',
      last_name: admin.last_name ?? '',
      email: admin.email ?? '',
      password: '',
      password_confirmation: '',
      role: matchedRole,
    })
    setShowDialog(true)
  }

  async function submit() {
    setSaving(true)
    if (isCreate) {
      const result = await platformAdminApi.createAdmin({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        password: form.password,
        password_confirmation: form.password_confirmation,
        role: form.role,
      })
      if (!result.ok) {
        sileo.error({ title: result.message || 'Could not create admin' })
        setSaving(false)
        return
      }
      sileo.success({ title: 'Admin created' })
    } else {
      const body: Record<string, unknown> = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
      }
      if (form.password) {
        body.password = form.password
        body.password_confirmation = form.password_confirmation
      }
      const result = await platformAdminApi.updateAdmin(editingUlid!, body)
      if (!result.ok) {
        sileo.error({ title: result.message || 'Could not update admin' })
        setSaving(false)
        return
      }
      sileo.success({ title: 'Admin updated' })
    }
    resetForm()
    await load()
  }

  async function approve(admin: PlatformAdmin) {
    const draft = roleDrafts[admin.ulid]
    const role = draft === 'content_manager' || draft === 'support_agent' ? draft : 'content_manager'
    const result = await platformAdminApi.approveAdmin(admin.ulid, role)
    if (!result.ok) {
      sileo.error({ title: result.message || 'Could not approve admin' })
      return
    }
    sileo.success({ title: 'Admin approved' })
    await load()
  }

  async function addRole(admin: PlatformAdmin) {
    const role = roleDrafts[admin.ulid]
    if (!role) return
    const result = await platformAdminApi.addAdminRole(admin.ulid, role)
    if (!result.ok) {
      sileo.error({ title: result.message || 'Could not assign role' })
      return
    }
    sileo.success({ title: 'Role assigned' })
    await load()
  }

  async function removeRole(admin: PlatformAdmin, role: string) {
    const result = await platformAdminApi.removeAdminRole(admin.ulid, role)
    if (!result.ok) {
      sileo.error({ title: result.message || 'Could not remove role' })
      return
    }
    sileo.success({ title: 'Role removed' })
    await load()
  }

  async function remove(admin: PlatformAdmin) {
    if (!window.confirm(`Delete admin "${admin.email ?? admin.ulid}"?`)) return
    const result = await platformAdminApi.deleteAdmin(admin.ulid)
    if (!result.ok) {
      sileo.error({ title: result.message || 'Could not delete admin' })
      return
    }
    sileo.success({ title: 'Admin deleted' })
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
            {isCreate ? t('createAdmin') : t('editAdmin')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {showDialog && (
            <Dialog open={showDialog} onOpenChange={() => setShowDialog(false)}>
              <DialogHeader>
                <DialogTitle>{isCreate ? t('createAdmin') : t('editAdmin')}</DialogTitle>
                <DialogDescription>{isCreate ? t('fillFormToCreateAdmin') : t('fillFormToEditAdmin')}</DialogDescription>
              </DialogHeader>
              <DialogContent className="px-4 pb-2">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="admin-first">First name</Label>
                    <Input id="admin-first" value={form.first_name} onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="admin-last">Last name</Label>
                    <Input id="admin-last" value={form.last_name} onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="admin-email">Email</Label>
                    <Input id="admin-email" type="email" dir="ltr" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="admin-password">Password {editingUlid && <span className="text-muted-foreground">(optional)</span>}</Label>
                    <Input id="admin-password" type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="admin-password-confirm">Confirm password</Label>
                    <Input id="admin-password-confirm" type="password" value={form.password_confirmation} onChange={(e) => setForm((f) => ({ ...f, password_confirmation: e.target.value }))} />
                  </div>
                  {!isCreate && (
                    <div className="flex flex-col gap-1.5">
                      <Label>Role</Label>
                      <Select value={form.role} onValueChange={(value) => setForm((f) => ({ ...f, role: value ?? '' }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(
                roles.length > 0
                  ? roles.map((r) => r.name)
                  : ['super_admin', 'content_manager', 'support_agent']
              ).map((role) => (
                            <SelectItem key={role} value={role}>{role}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <Button type="submit" disabled={saving}>
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
              <Button onClick={() => startCreate()}>{t('createAdmin')}</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="size-4" /> Admins
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading admins…</p>
          ) : admins.length === 0 ? (
            <p className="text-sm text-muted-foreground">No admins found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Admin</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => {
                  const status = statusId(admin)
                  return (
                    <TableRow key={admin.ulid}>
                      <TableCell>
                        <p className="font-medium">
                          {[admin.first_name, admin.last_name].filter(Boolean).join(' ') || admin.name || admin.email || admin.ulid}
                        </p>
                        <p className="text-xs text-muted-foreground" dir="ltr">{admin.email ?? '—'}</p>
                        {admin.is_super_admin && <p className="text-xs text-primary">Super admin</p>}
                      </TableCell>
                      <TableCell>{status ? STATUS_LABELS[status] ?? status : '—'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {roleList(admin).map((r) => (
                            <span key={r.name || String(r)} className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs">
                              {r.name || r.label || String(r)}
                            </span>
                          ))}
                          {roleList(admin).length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-end">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(admin)}
                          >
                            <Pencil className="size-4" />
                            {t('edit')}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => remove(admin)}
                          >
                            <Trash2 className="size-4" />
                            {t('delete')}
                          </Button>
                        </div>
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