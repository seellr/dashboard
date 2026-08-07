'use client'

import { useState } from 'react'
import { z } from 'zod'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { adminFetchClient } from '@/lib/admin/api-client'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

export type AutomationRuleAction = {
  action_type: string
  action_value: string | null
  sort_order: number
}

export type AutomationRule = {
  ulid: string
  name: string
  trigger_event: number
  trigger_value: string | null
  conditions: unknown[]
  actions: AutomationRuleAction[]
  active: boolean
  created_at: string
}

const automationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  trigger_event: z.string().min(1, 'Trigger event is required'),
  action_type: z.string().min(1, 'Action type is required'),
  action_value: z.string().max(500).optional(),
  active: z.boolean(),
})

type AutomationFormValues = z.infer<typeof automationSchema>

const TRIGGER_EVENTS: Record<number, string> = {
  1: 'Purchase Completed',
  2: 'Cart Abandoned',
  3: 'Quiz Completed',
  4: 'AI Tool Run',
  5: 'Product Viewed',
  6: 'Lead Registered',
  7: 'Tag Added',
  8: 'Score Threshold',
  9: 'Buyer Type Changed',
}

const ACTION_TYPES: Record<string, string> = {
  add_tag:         'Add Tag',
  remove_tag:      'Remove Tag',
  add_score:       'Add Score',
  subtract_score:  'Subtract Score',
  enroll_sequence: 'Enroll in Sequence',
  send_email:      'Send Email',
}

interface Props {
  locale: string
  initialRules: AutomationRule[]
}

export function AutomationRulesClient({ locale, initialRules }: Props) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<AutomationFormValues>({
    resolver: zodResolver(automationSchema),
    defaultValues: { name: '', trigger_event: '', action_type: '', action_value: '', active: true },
  })

  const createMutation = useMutation({
    mutationFn: (f: AutomationFormValues) =>
      adminFetchClient('/automation-rules', {
        method: 'POST',
        body: JSON.stringify({
          brand_id: 1,
          name: f.name,
          trigger_event: Number(f.trigger_event),
          conditions: [],
          actions: [{
            action_type: f.action_type,
            action_value: f.action_value ?? '',
            sort_order: 0,
          }],
          active: f.active,
        }),
      }),
    onSuccess: (res) => {
      if (!res.ok) { setServerError(res.message); return }
      setDialogOpen(false); reset(); setServerError(null); router.refresh()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (ulid: string) =>
      adminFetchClient(`/automation-rules/${ulid}`, { method: 'DELETE' }),
    onSuccess: () => router.refresh(),
  })

  const toggleMutation = useMutation({
    mutationFn: (ulid: string) =>
      adminFetchClient(`/automation-rules/${ulid}/toggle`, { method: 'PATCH' }),
    onSuccess: () => router.refresh(),
  })

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => { reset(); setServerError(null); setDialogOpen(true) }}>
          + New Rule
        </Button>
      </div>

      {initialRules.length === 0 ? (
        <p className="text-muted-foreground">No automation rules yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Trigger Event</TableHead>
              <TableHead>Action Type</TableHead>
              <TableHead>Action Value</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-end">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialRules.map((rule) => (
              <TableRow key={rule.ulid}>
                <TableCell>{rule.name}</TableCell>
                <TableCell>{TRIGGER_EVENTS[rule.trigger_event] ?? rule.trigger_event}</TableCell>
                <TableCell>{ACTION_TYPES[rule.actions[0]?.action_type] ?? rule.actions[0]?.action_type ?? '—'}</TableCell>
                <TableCell>{rule.actions[0]?.action_value ?? '—'}</TableCell>
                <TableCell>
                  <Badge
                    variant={rule.active ? 'new' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleMutation.mutate(rule.ulid)}
                  >
                    {rule.active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-end">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteMutation.mutate(rule.ulid)}
                    disabled={deleteMutation.isPending}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) { setDialogOpen(false); reset(); setServerError(null) } }} disablePointerDismissal>
        <DialogContent>
          <DialogHeader><DialogTitle>New Automation Rule</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit((v) => createMutation.mutate(v))}>
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-1.5">
                <Label>Name *</Label>
                <Input {...register('name')} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Trigger Event *</Label>
                <Controller
                  control={control}
                  name="trigger_event"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select trigger…">
                          {(value: string | null) => value ? TRIGGER_EVENTS[Number(value)] : null}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TRIGGER_EVENTS).map(([k, label]) => (
                          <SelectItem key={k} value={k}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.trigger_event && <p className="text-sm text-destructive">{errors.trigger_event.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Action Type *</Label>
                <Controller
                  control={control}
                  name="action_type"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select action…">
                          {(value: string | null) => value ? ACTION_TYPES[value] : null}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ACTION_TYPES).map(([k, label]) => (
                          <SelectItem key={k} value={k}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.action_type && <p className="text-sm text-destructive">{errors.action_type.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Action Value</Label>
                <Input {...register('action_value')} placeholder="e.g. vip, 50" />
                {errors.action_value && <p className="text-sm text-destructive">{errors.action_value.message}</p>}
              </div>
              <div className="flex items-center gap-3">
                <Controller
                  control={control}
                  name="active"
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
                <Label>Active</Label>
              </div>
              {serverError && <p className="text-sm text-destructive">{serverError}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); reset(); setServerError(null) }}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
