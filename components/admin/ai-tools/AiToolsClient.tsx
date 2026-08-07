'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { adminFetchClient } from '@/lib/admin/api-client'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { sileo } from 'sileo'
import { AiToolFormClient } from './AiToolFormClient'

interface AiTool {
  ulid: string
  slug: string
  name: string
  prompt_template?: string
  openrouter_model?: string
  max_tokens?: number
  rate_limit_per_day?: number
  active: boolean
  created_at: string
}

interface Props {
  locale: string
  initialItems: AiTool[]
}

export function AiToolsClient({ locale, initialItems }: Props) {
  const router = useRouter()
  const [pendingDelete, setPendingDelete] = useState<AiTool | null>(null)
  const [dialogUlid, setDialogUlid] = useState<string | null>(null)

  const deleteMutation = useMutation({
    mutationFn: async (ulid: string) => {
      const result = await adminFetchClient(`/ai-tools/${ulid}`, { method: 'DELETE' })
      if (!result.ok) throw new Error(result.message)
    },
    onSuccess: () => {
      sileo.success({ title: 'AI Tool deleted' })
      setPendingDelete(null)
      router.refresh()
    },
    onError: (err: Error) => {
      sileo.error({ title: err.message })
    },
  })

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{initialItems.length} tools</p>
        <Button size="sm" onClick={() => setDialogUlid('new')}>
          + New AI Tool
        </Button>
      </div>

      {initialItems.length === 0 ? (
        <p className="text-muted-foreground">No AI tools yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Rate Limit/day</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-end">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialItems.map((tool) => (
              <TableRow key={tool.ulid}>
                <TableCell>{tool.name}</TableCell>
                <TableCell className="font-mono text-sm">{tool.slug}</TableCell>
                <TableCell className="text-sm">{tool.openrouter_model ?? '—'}</TableCell>
                <TableCell>{tool.rate_limit_per_day ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant={tool.active ? 'new' : 'outline'}>
                    {tool.active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-end">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDialogUlid(tool.ulid)}
                    >
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setPendingDelete(tool)}>
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Create / Edit modal */}
      <Dialog open={!!dialogUlid} onOpenChange={(open) => !open && setDialogUlid(null)} disablePointerDismissal>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{dialogUlid === 'new' ? 'New AI Tool' : 'Edit AI Tool'}</DialogTitle>
          </DialogHeader>
          {dialogUlid && (
            <AiToolFormClient
              existing={dialogUlid === 'new' ? null : (initialItems.find(t => t.ulid === dialogUlid) ?? null)}
              ulid={dialogUlid}
              onSuccess={() => {
                setDialogUlid(null)
                router.refresh()
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm modal */}
      <Dialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete AI Tool</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete <strong>{pendingDelete?.name}</strong>?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => pendingDelete && deleteMutation.mutate(pendingDelete.ulid)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
