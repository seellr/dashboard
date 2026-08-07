'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { adminFetchClient } from '@/lib/admin/api-client'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { sileo } from 'sileo'

interface Quiz {
  ulid: string
  slug: string
  type: number
  active: boolean
  title: string
  description: string | null
  created_at: string
}

interface Props {
  locale: string
  initialItems: Quiz[]
}

export function QuizzesClient({ locale: _locale, initialItems }: Props) {
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Quiz | null>(null)

  const [slug, setSlug] = useState('')
  const [titleAr, setTitleAr] = useState('')
  const [titleEn, setTitleEn] = useState('')
  const [descAr, setDescAr] = useState('')
  const [type, setType] = useState('1')
  const [active, setActive] = useState(true)

  const createMutation = useMutation({
    mutationFn: async () => {
      const result = await adminFetchClient('/quizzes', {
        method: 'POST',
        body: JSON.stringify({
          slug,
          brand_id: 1,
          type: Number(type),
          active,
          translations: [
            { locale: 'ar', title: titleAr, description: descAr || null },
            ...(titleEn ? [{ locale: 'en', title: titleEn, description: null }] : []),
          ],
        }),
      })
      if (!result.ok) throw new Error(result.message)
    },
    onSuccess: () => {
      sileo.success({ title: 'Quiz created' })
      setCreateOpen(false)
      setSlug('')
      setTitleAr('')
      setTitleEn('')
      setDescAr('')
      setType('1')
      setActive(true)
      router.refresh()
    },
    onError: (err: Error) => sileo.error({ title: err.message }),
  })

  const deleteMutation = useMutation({
    mutationFn: async (ulid: string) => {
      const result = await adminFetchClient(`/quizzes/${ulid}`, { method: 'DELETE' })
      if (!result.ok) throw new Error(result.message)
    },
    onSuccess: () => {
      sileo.success({ title: 'Quiz deleted' })
      setPendingDelete(null)
      router.refresh()
    },
    onError: (err: Error) => sileo.error({ title: err.message }),
  })

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>+ New Quiz</Button>
      </div>

      {initialItems.length === 0 ? (
        <p className="text-muted-foreground">No quizzes yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-end">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialItems.map((quiz) => (
              <TableRow key={quiz.ulid}>
                <TableCell>{quiz.title}</TableCell>
                <TableCell className="font-mono text-sm">{quiz.slug}</TableCell>
                <TableCell>{quiz.type === 1 ? 'Free' : 'Paid'}</TableCell>
                <TableCell>
                  <Badge variant={quiz.active ? 'new' : 'outline'}>
                    {quiz.active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(quiz.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-end">
                  <Button size="sm" variant="destructive" onClick={() => setPendingDelete(quiz)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Quiz</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => { e.preventDefault(); createMutation.mutate() }}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="quiz-slug">Slug</Label>
              <Input id="quiz-slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="my-quiz" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="quiz-title-ar">Title (AR) *</Label>
              <Input id="quiz-title-ar" value={titleAr} onChange={(e) => setTitleAr(e.target.value)} required dir="rtl" placeholder="عنوان الاختبار" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="quiz-title-en">Title (EN)</Label>
              <Input id="quiz-title-en" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} placeholder="Quiz title" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="quiz-desc-ar">Description (AR)</Label>
              <Input id="quiz-desc-ar" value={descAr} onChange={(e) => setDescAr(e.target.value)} dir="rtl" placeholder="وصف الاختبار" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => v && setType(v)}>
                <SelectTrigger>
                  <SelectValue>{(v: string | null) => v === '1' ? 'Free' : v === '2' ? 'Paid' : 'Select type'}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Free</SelectItem>
                  <SelectItem value="2">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="quiz-active" checked={active} onCheckedChange={setActive} />
              <Label htmlFor="quiz-active">Active</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating…' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Quiz</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete <strong>{pendingDelete?.title}</strong>?</p>
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
