'use client'

import DOMPurify from 'dompurify'
import { useState } from 'react'
import { z } from 'zod'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminFetchClient } from '@/lib/admin/api-client'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

type EmailSequenceStep = {
  id: number
  delay_hours: number
  subject: string
  body_html: string
  sort_order: number
}

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

type EmailSequence = {
  ulid: string
  name: string
  trigger_event: { id: number; label: string }
  active: boolean
  steps?: EmailSequenceStep[]
  created_at: string
}

const seqSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  trigger_event: z.number().int().min(1).max(9),
  active: z.boolean(),
})
type SeqFormValues = z.infer<typeof seqSchema>

const stepSchema = z.object({
  delay_hours: z.number({ error: 'Must be a number' }).int().min(0),
  subject: z.string().min(1, 'Subject is required').max(500),
  body_html: z.string().max(100000).optional(),
  sort_order: z.number({ error: 'Must be a number' }).int().min(0),
})
type StepFormValues = z.infer<typeof stepSchema>

export function EmailSequencesClient({ locale }: { locale: string }) {
  const qc = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [seqServerError, setSeqServerError] = useState<string | null>(null)

  const [detailSeq, setDetailSeq] = useState<EmailSequence | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const [addStepOpen, setAddStepOpen] = useState(false)
  const [stepServerError, setStepServerError] = useState<string | null>(null)

  const seqForm = useForm<SeqFormValues>({
    resolver: zodResolver(seqSchema),
    defaultValues: { name: '', trigger_event: 1, active: true },
  })

  const stepForm = useForm<StepFormValues>({
    resolver: zodResolver(stepSchema),
    defaultValues: { delay_hours: 0, subject: '', body_html: '', sort_order: 0 },
  })

  const { data: sequences = [], isLoading } = useQuery<EmailSequence[]>({
    queryKey: ['admin', 'email-sequences'],
    queryFn: async () => {
      const res = await adminFetchClient<EmailSequence[]>('/email/sequences')
      return res.ok ? res.data : []
    },
  })

  const { data: seqDetail } = useQuery<EmailSequence | null>({
    queryKey: ['admin', 'email-sequence', detailSeq?.ulid],
    queryFn: async () => {
      if (!detailSeq) return null
      const res = await adminFetchClient<EmailSequence>(`/email/sequences/${detailSeq.ulid}`)
      return res.ok ? res.data : null
    },
    enabled: !!detailSeq,
  })

  const invalidateList = () => qc.invalidateQueries({ queryKey: ['admin', 'email-sequences'] })
  const invalidateDetail = () => qc.invalidateQueries({ queryKey: ['admin', 'email-sequence', detailSeq?.ulid] })

  const createMutation = useMutation({
    mutationFn: (f: SeqFormValues) =>
      adminFetchClient('/email/sequences', {
        method: 'POST',
        body: JSON.stringify({ brand_id: 1, ...f }),
      }),
    onSuccess: (res) => {
      if (!res.ok) { setSeqServerError(res.message); return }
      setCreateOpen(false); setSeqServerError(null); seqForm.reset(); invalidateList()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (ulid: string) =>
      adminFetchClient(`/email/sequences/${ulid}`, { method: 'DELETE' }),
    onSuccess: () => invalidateList(),
  })

  const addStepMutation = useMutation({
    mutationFn: (f: StepFormValues) =>
      adminFetchClient(`/email/sequences/${detailSeq!.ulid}/steps`, {
        method: 'POST',
        body: JSON.stringify(f),
      }),
    onSuccess: (res) => {
      if (!res.ok) { setStepServerError(res.message); return }
      invalidateDetail(); setAddStepOpen(false); stepForm.reset(); setStepServerError(null)
    },
  })

  const deleteStepMutation = useMutation({
    mutationFn: ({ stepId }: { stepId: number }) =>
      adminFetchClient(`/email/sequences/${detailSeq!.ulid}/steps/${stepId}`, { method: 'DELETE' }),
    onSuccess: () => invalidateDetail(),
  })

  function openDetail(seq: EmailSequence) {
    setDetailSeq(seq); setSheetOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md" />
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => { seqForm.reset(); setSeqServerError(null); setCreateOpen(true) }}>
          + New Sequence
        </Button>
      </div>

      {sequences.length === 0 ? (
        <p className="text-muted-foreground">No email sequences yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Trigger</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-end">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sequences.map((seq) => (
              <TableRow key={seq.ulid} className="cursor-pointer" onClick={() => openDetail(seq)}>
                <TableCell>{seq.name}</TableCell>
                <TableCell>{TRIGGER_EVENTS[seq.trigger_event?.id] ?? seq.trigger_event?.label}</TableCell>
                <TableCell>
                  <Badge variant={seq.active ? 'new' : 'outline'}>
                    {seq.active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-end" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteMutation.mutate(seq.ulid)}
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

      {/* Create sequence dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen} disablePointerDismissal>
        <DialogContent>
          <DialogHeader><DialogTitle>New Email Sequence</DialogTitle></DialogHeader>
          <form onSubmit={seqForm.handleSubmit((v) => createMutation.mutate(v))}>
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-1.5">
                <Label>Name *</Label>
                <Input {...seqForm.register('name')} />
                {seqForm.formState.errors.name && (
                  <p className="text-sm text-destructive">{seqForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Trigger Event *</Label>
                <Controller
                  control={seqForm.control}
                  name="trigger_event"
                  render={({ field }) => (
                    <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select trigger…">
                          {(value: string | null) => value && value !== '0' ? TRIGGER_EVENTS[Number(value)] : null}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TRIGGER_EVENTS).map(([val, label]) => (
                          <SelectItem key={val} value={val}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="flex items-center gap-3">
                <Controller
                  control={seqForm.control}
                  name="active"
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
                <Label>Active</Label>
              </div>
              {seqServerError && <p className="text-sm text-destructive">{seqServerError}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sequence detail sheet */}
      <Sheet open={sheetOpen} onOpenChange={(v) => { if (!v) { setSheetOpen(false); setDetailSeq(null) } }}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{detailSeq?.name} — Steps</SheetTitle>
          </SheetHeader>
          <div className="mt-4 flex flex-col gap-4">
            <Button size="sm" onClick={() => { stepForm.reset(); setStepServerError(null); setAddStepOpen(true) }}>
              + Add Step
            </Button>
            {(seqDetail?.steps ?? []).length === 0 ? (
              <p className="text-muted-foreground text-sm">No steps yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {(seqDetail?.steps ?? []).map((step) => (
                  <div key={step.id} className="rounded-md border p-3 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{step.subject}</span>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteStepMutation.mutate({ stepId: step.id })}
                        disabled={deleteStepMutation.isPending}
                      >
                        Delete
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Delay: {step.delay_hours}h · Sort: {step.sort_order}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(step.body_html ?? '') }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Add step dialog */}
      <Dialog open={addStepOpen} onOpenChange={setAddStepOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Step</DialogTitle></DialogHeader>
          <form onSubmit={stepForm.handleSubmit((v) => addStepMutation.mutate(v))}>
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-1.5">
                <Label>Delay Hours</Label>
                <Input type="number" {...stepForm.register('delay_hours', { valueAsNumber: true })} />
                {stepForm.formState.errors.delay_hours && (
                  <p className="text-sm text-destructive">{stepForm.formState.errors.delay_hours.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Subject *</Label>
                <Input {...stepForm.register('subject')} />
                {stepForm.formState.errors.subject && (
                  <p className="text-sm text-destructive">{stepForm.formState.errors.subject.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Body HTML</Label>
                <Textarea rows={6} {...stepForm.register('body_html')} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Sort Order</Label>
                <Input type="number" {...stepForm.register('sort_order', { valueAsNumber: true })} />
                {stepForm.formState.errors.sort_order && (
                  <p className="text-sm text-destructive">{stepForm.formState.errors.sort_order.message}</p>
                )}
              </div>
              {stepServerError && <p className="text-sm text-destructive">{stepServerError}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddStepOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={addStepMutation.isPending}>
                {addStepMutation.isPending ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
