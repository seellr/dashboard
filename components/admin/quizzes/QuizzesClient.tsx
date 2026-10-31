'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { sileo } from 'sileo'
import { ExternalLink, Edit, Settings, Trash2 } from 'lucide-react'
import {
  useQuizzesQuery,
  useCreateQuizMutation,
  useUpdateQuizMutation,
  useDeleteQuizMutation,
} from '@/hooks/queries/useQuizzes'
import { getLocaleEntry, getQuizTypeId } from '@/types/dto/quiz.dto'
import type { Quiz } from '@/types/dto/quiz.dto'

interface Props {
  locale: string
  initialItems: Quiz[]
}

export function QuizzesClient({ locale, initialItems }: Props) {
  const router = useRouter()
  const { data: quizzes = initialItems } = useQuizzesQuery()

  const [createOpen, setCreateOpen] = useState(false)
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Quiz | null>(null)

  // Form states
  const [slug, setSlug] = useState('')
  const [titleAr, setTitleAr] = useState('')
  const [titleEn, setTitleEn] = useState('')
  const [descAr, setDescAr] = useState('')
  const [descEn, setDescEn] = useState('')
  const [type, setType] = useState('1')
  const [active, setActive] = useState(true)

  const createMutation = useCreateQuizMutation()
  const updateMutation = useUpdateQuizMutation(editingQuiz?.ulid ?? '')
  const deleteMutation = useDeleteQuizMutation()

  const resetForm = () => {
    setSlug('')
    setTitleAr('')
    setTitleEn('')
    setDescAr('')
    setDescEn('')
    setType('1')
    setActive(true)
    setEditingQuiz(null)
  }

  const openCreateDialog = () => {
    resetForm()
    setCreateOpen(true)
  }

  const openEditDialog = (quiz: Quiz) => {
    setEditingQuiz(quiz)
    setSlug(quiz.slug)
    const arTrans = getLocaleEntry(quiz.translations, 'ar') as { title?: string; description?: string | null } | undefined
    const enTrans = getLocaleEntry(quiz.translations, 'en') as { title?: string; description?: string | null } | undefined
    setTitleAr(arTrans?.title || quiz.title || '')
    setDescAr(arTrans?.description || quiz.description || '')
    setTitleEn(enTrans?.title || '')
    setDescEn(enTrans?.description || '')
    const quizTypeId = getQuizTypeId(quiz.type)
    setType(String(quizTypeId || 1))
    setActive(quiz.active)
    setCreateOpen(true)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      slug,
      brand_id: 1,
      type: Number(type) || 1,
      active,
      translations: [
        { locale: 'ar', title: titleAr, description: descAr || null },
        ...(titleEn ? [{ locale: 'en', title: titleEn, description: descEn || null }] : []),
      ],
    }

    try {
      if (editingQuiz) {
        await updateMutation.mutateAsync(payload)
        sileo.success({ title: 'Quiz updated' })
      } else {
        await createMutation.mutateAsync(payload)
        sileo.success({ title: 'Quiz created' })
      }
      setCreateOpen(false)
      resetForm()
      router.refresh()
    } catch (err) {
      sileo.error({ title: (err as Error).message })
    }
  }

  const handleDelete = async (quiz: Quiz) => {
    try {
      await deleteMutation.mutateAsync(quiz.ulid)
      sileo.success({ title: 'Quiz deleted' })
      setPendingDelete(null)
      router.refresh()
    } catch (err) {
      sileo.error({ title: (err as Error).message })
    }
  }

  return (
    <>
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">Manage your quizzes, questions, and archetypes.</p>
        <Button onClick={openCreateDialog}>+ New Quiz</Button>
      </div>

      {quizzes.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground mb-4">No quizzes found.</p>
          <Button onClick={openCreateDialog}>Create First Quiz</Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-end">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quizzes.map((quiz) => (
                <TableRow key={quiz.ulid}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{quiz.title}</span>
                      {quiz.description && (
                        <span className="text-xs text-muted-foreground line-clamp-1">{quiz.description}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{quiz.slug}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {getQuizTypeId(quiz.type) === 1 ? 'Free' : 'Paid'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={quiz.active ? 'default' : 'secondary'} className="text-xs">
                      {quiz.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(quiz.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-end">
                    <div className="flex justify-end gap-1.5">
                      <Link href={`/${locale}/quizzes/${quiz.ulid}`}>
                        <Button size="sm" variant="outline" title="Manage Questions & Archetypes">
                          <Settings className="size-3.5 me-1" />
                          Builder
                        </Button>
                      </Link>
                      <a href={`/${locale}/quiz/${quiz.slug}`} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="ghost" title="View Public Quiz">
                          <ExternalLink className="size-3.5" />
                        </Button>
                      </a>
                      <Button size="sm" variant="ghost" onClick={() => openEditDialog(quiz)} title="Edit Settings">
                        <Edit className="size-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setPendingDelete(quiz)} title="Delete Quiz">
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Quiz Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingQuiz ? 'Edit Quiz' : 'New Quiz'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="quiz-slug">Slug *</Label>
              <Input
                id="quiz-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="career-assessment"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="quiz-title-ar">Title (Arabic) *</Label>
              <Input
                id="quiz-title-ar"
                value={titleAr}
                onChange={(e) => setTitleAr(e.target.value)}
                required
                dir="rtl"
                placeholder="عنوان الاختبار"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="quiz-desc-ar">Description (Arabic)</Label>
              <Input
                id="quiz-desc-ar"
                value={descAr}
                onChange={(e) => setDescAr(e.target.value)}
                dir="rtl"
                placeholder="وصف مختصر عن الاختبار"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="quiz-title-en">Title (English)</Label>
              <Input
                id="quiz-title-en"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder="Quiz Title"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="quiz-desc-en">Description (English)</Label>
              <Input
                id="quiz-desc-en"
                value={descEn}
                onChange={(e) => setDescEn(e.target.value)}
                placeholder="Short description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Type</Label>
                <Select value={type} onValueChange={(v) => v && setType(v)}>
                  <SelectTrigger>
                    <SelectValue>{(v: string | null) => (v === '1' ? 'Free' : 'Paid')}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Free</SelectItem>
                    <SelectItem value="2">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col justify-end gap-1.5">
                <div className="flex items-center gap-2 pt-3">
                  <Switch id="quiz-active" checked={active} onCheckedChange={setActive} />
                  <Label htmlFor="quiz-active">Active</Label>
                </div>
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? 'Saving…' : 'Save Quiz'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Quiz</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{pendingDelete?.title}</strong>? All questions, answers, and archetypes will be deleted.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => pendingDelete && handleDelete(pendingDelete)}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
