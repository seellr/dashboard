'use client'

import { useState } from 'react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'

import { sileo } from 'sileo'

import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  HelpCircle,
  Award,
  Package,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

import {
  useQuizQuery,
  useUpdateQuizMutation,
  useCreateQuestionMutation,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
  useCreateAnswerMutation,
  useUpdateAnswerMutation,
  useDeleteAnswerMutation,
  useCreateArchetypeMutation,
  useUpdateArchetypeMutation,
  useDeleteArchetypeMutation,
  useAttachArchetypeProductMutation,
  useDetachArchetypeProductMutation,
} from '@/hooks/queries/useQuizzes'

import { useProductsAllQuery } from '@/hooks/queries/useProductsAll'

import {
  getLocaleEntry,
  getQuestionTypeId,
  getQuizTypeId,
} from '@/types/dto/quiz.dto'

import type {
  Quiz,
  QuizQuestion,
  QuizAnswer,
  QuizArchetype,
} from '@/types/dto/quiz.dto'

interface Props {
  locale: string
  ulid: string
  initialQuiz: Quiz | null
}

export function QuizBuilderClient({
  locale,
  ulid,
  initialQuiz,
}: Props) {
  const { data: quiz = initialQuiz, isLoading } = useQuizQuery(ulid)

  const { data: allProducts = [] } = useProductsAllQuery()

  // ================= Tabs State =================

  const [activeTab, setActiveTab] = useState<
    'questions' | 'archetypes' | 'settings'
  >('questions')

  const [expandedQuestionId, setExpandedQuestionId] = useState<
    number | null
  >(null)

  // ================= Questions State =================

  const [questionModalOpen, setQuestionModalOpen] = useState(false)

  const [editingQuestion, setEditingQuestion] =
    useState<QuizQuestion | null>(null)

  const [qTextAr, setQTextAr] = useState('')
  const [qTextEn, setQTextEn] = useState('')
  const [qType, setQType] = useState('1')
  const [qSortOrder, setQSortOrder] = useState(0)

  // ================= Answers State =================

  const [answerModalOpen, setAnswerModalOpen] = useState(false)

  const [targetQuestionId, setTargetQuestionId] = useState<
    number | null
  >(null)

  const [editingAnswer, setEditingAnswer] =
    useState<QuizAnswer | null>(null)

  const [aTextAr, setATextAr] = useState('')
  const [aTextEn, setATextEn] = useState('')
  const [aScore, setAScore] = useState(0)
  const [aSortOrder, setASortOrder] = useState(0)
  const [aTags, setATags] = useState('')

  // ================= Archetypes State =================

  const [archetypeModalOpen, setArchetypeModalOpen] =
    useState(false)

  const [editingArchetype, setEditingArchetype] =
    useState<QuizArchetype | null>(null)

  const [archSlug, setArchSlug] = useState('')
  const [archMinScore, setArchMinScore] = useState(0)
  const [archMaxScore, setArchMaxScore] = useState(100)

  const [archNameAr, setArchNameAr] = useState('')
  const [archHeadlineAr, setArchHeadlineAr] = useState('')
  const [archDescAr, setArchDescAr] = useState('')

  const [archNameEn, setArchNameEn] = useState('')
  const [archHeadlineEn, setArchHeadlineEn] = useState('')
  const [archDescEn, setArchDescEn] = useState('')

  // ================= Product Attachment State =================

  const [attachModalOpen, setAttachModalOpen] = useState(false)

  const [targetArchetypeId, setTargetArchetypeId] =
    useState<number | null>(null)

  const [selectedProductId, setSelectedProductId] = useState('')

  // ================= Settings State =================

  const [settingsSlug, setSettingsSlug] = useState('')
  const [settingsTitleAr, setSettingsTitleAr] = useState('')
  const [settingsDescAr, setSettingsDescAr] = useState('')

  const [settingsTitleEn, setSettingsTitleEn] = useState('')
  const [settingsDescEn, setSettingsDescEn] = useState('')

  const [settingsType, setSettingsType] = useState('1')
  const [settingsActive, setSettingsActive] = useState(true)

  // ================= Mutations =================

  const updateQuizMut = useUpdateQuizMutation(ulid)

  const createQMut = useCreateQuestionMutation(ulid)
  const updateQMut = useUpdateQuestionMutation(ulid)
  const deleteQMut = useDeleteQuestionMutation(ulid)

  const createAMut = useCreateAnswerMutation(
    ulid,
    targetQuestionId ?? 0
  )

  const updateAMut = useUpdateAnswerMutation(ulid)
  const deleteAMut = useDeleteAnswerMutation(ulid)

  const createArchMut = useCreateArchetypeMutation(ulid)
  const updateArchMut = useUpdateArchetypeMutation(ulid)
  const deleteArchMut = useDeleteArchetypeMutation(ulid)

  const attachProductMut =
    useAttachArchetypeProductMutation(ulid)

  const detachProductMut =
    useDetachArchetypeProductMutation(ulid)

  // ================= Loading =================

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-10">
        <h2 className="text-xl font-semibold">
          Quiz not found
        </h2>

        <Link href={`/${locale}/quizzes`}>
          <Button variant="outline">
            <ArrowLeft className="size-4 me-2" />
            Back to Quizzes
          </Button>
        </Link>
      </div>
    )
  }

  // ============================================================
  // Question Modal Helpers
  // ============================================================

  const openCreateQuestion = () => {
    setEditingQuestion(null)

    setQTextAr('')
    setQTextEn('')

    setQType('1')

    setQSortOrder((quiz.questions?.length ?? 0) + 1)

    setQuestionModalOpen(true)
  }

  const openEditQuestion = (q: QuizQuestion) => {
    setEditingQuestion(q)

    const ar = getLocaleEntry(
      q.translations,
      'ar'
    ) as { text?: string } | undefined

    const en = getLocaleEntry(
      q.translations,
      'en'
    ) as { text?: string } | undefined

    setQTextAr(ar?.text || q.text || '')
    setQTextEn(en?.text || '')

    setQType(String(getQuestionTypeId(q.type)))

    setQSortOrder(q.sort_order)

    setQuestionModalOpen(true)
  }

  const handleSaveQuestion = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault()

    const payload = {
      type: Number(qType) || 1,

      sort_order: Number(qSortOrder),

      translations: [
        { locale: 'ar', text: qTextAr },
        ...(qTextEn ? [{ locale: 'en', text: qTextEn }] : []),
      ],
    }

    try {
      if (editingQuestion) {
        await updateQMut.mutateAsync({
          questionId: editingQuestion.id,
          data: payload,
        })

        sileo.success({
          title: 'Question updated',
        })
      } else {
        await createQMut.mutateAsync(payload)

        sileo.success({
          title: 'Question created',
        })
      }

      setQuestionModalOpen(false)
    } catch (err) {
      sileo.error({
        title:
          err instanceof Error
            ? err.message
            : 'Something went wrong',
      })
    }
  }

  const handleDeleteQuestion = async (id: number) => {
    try {
      await deleteQMut.mutateAsync(id)

      sileo.success({
        title: 'Question deleted',
      })

      if (expandedQuestionId === id) {
        setExpandedQuestionId(null)
      }
    } catch (err) {
      sileo.error({
        title:
          err instanceof Error
            ? err.message
            : 'Something went wrong',
      })
    }
  }

  // ============================================================
  // Answer Modal Helpers
  // ============================================================

  const openCreateAnswer = (questionId: number) => {
    setTargetQuestionId(questionId)

    setEditingAnswer(null)

    setATextAr('')
    setATextEn('')

    setAScore(10)

    const question = quiz.questions?.find(
      (item) => item.id === questionId
    )

    setASortOrder(
      (question?.answers?.length ?? 0) + 1
    )

    setATags('')

    setAnswerModalOpen(true)
  }

  const openEditAnswer = (
    questionId: number,
    answer: QuizAnswer
  ) => {
    setTargetQuestionId(questionId)

    setEditingAnswer(answer)

    const ar = getLocaleEntry(
      answer.translations,
      'ar'
    ) as { text?: string } | undefined

    const en = getLocaleEntry(
      answer.translations,
      'en'
    ) as { text?: string } | undefined

    setATextAr(ar?.text || answer.text || '')
    setATextEn(en?.text || '')

    setAScore(answer.score)
    setASortOrder(answer.sort_order)

    setATags(answer.tags?.join(', ') || '')

    setAnswerModalOpen(true)
  }

  const handleSaveAnswer = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault()

    if (!targetQuestionId) {
      return
    }

    const parsedTags = aTags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)

    const payload = {
      score: Math.round(Number(aScore)),
      sort_order: Number(aSortOrder),

      tags: parsedTags,

      translations: [
        { locale: 'ar', text: aTextAr },
        ...(aTextEn ? [{ locale: 'en', text: aTextEn }] : []),
      ],
    }

    try {
      if (editingAnswer) {
        await updateAMut.mutateAsync({
          questionId: targetQuestionId,
          answerId: editingAnswer.id,
          data: payload,
        })

        sileo.success({
          title: 'Answer updated',
        })
      } else {
        await createAMut.mutateAsync(payload)

        sileo.success({
          title: 'Answer created',
        })
      }

      setAnswerModalOpen(false)
    } catch (err) {
      sileo.error({
        title:
          err instanceof Error
            ? err.message
            : 'Something went wrong',
      })
    }
  }

  const handleDeleteAnswer = async (
    questionId: number,
    answerId: number
  ) => {
    try {
      await deleteAMut.mutateAsync({ questionId, answerId })

      sileo.success({
        title: 'Answer deleted',
      })
    } catch (err) {
      sileo.error({
        title:
          err instanceof Error
            ? err.message
            : 'Something went wrong',
      })
    }
  }

  // ============================================================
  // Archetype Modal Helpers
  // ============================================================

  const openCreateArchetype = () => {
    setEditingArchetype(null)

    setArchSlug('')

    setArchMinScore(0)
    setArchMaxScore(50)

    setArchNameAr('')
    setArchHeadlineAr('')
    setArchDescAr('')

    setArchNameEn('')
    setArchHeadlineEn('')
    setArchDescEn('')

    setArchetypeModalOpen(true)
  }

  const openEditArchetype = (
    archetype: QuizArchetype
  ) => {
    setEditingArchetype(archetype)

    setArchSlug(archetype.slug)

    setArchMinScore(archetype.min_score)
    setArchMaxScore(archetype.max_score)

    const ar = getLocaleEntry(
      archetype.translations,
      'ar'
    ) as
      | {
        name?: string
        headline?: string
        description?: string
      }
      | undefined

    const en = getLocaleEntry(
      archetype.translations,
      'en'
    ) as
      | {
        name?: string
        headline?: string
        description?: string
      }
      | undefined

    setArchNameAr(
      ar?.name || archetype.name || ''
    )

    setArchHeadlineAr(
      ar?.headline || archetype.headline || ''
    )

    setArchDescAr(
      ar?.description ||
      archetype.description ||
      ''
    )

    setArchNameEn(en?.name || '')
    setArchHeadlineEn(en?.headline || '')
    setArchDescEn(en?.description || '')

    setArchetypeModalOpen(true)
  }

  const handleSaveArchetype = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault()

    const payload = {
      slug: archSlug,

      min_score: Number(archMinScore),
      max_score: Number(archMaxScore),

      translations: [
        { locale: 'ar', name: archNameAr, headline: archHeadlineAr, description: archDescAr },
        ...(archNameEn ? [{ locale: 'en', name: archNameEn, headline: archHeadlineEn, description: archDescEn }] : []),
      ],
    }

    try {
      if (editingArchetype) {
        await updateArchMut.mutateAsync({
          archetypeId: editingArchetype.id,
          data: payload,
        })

        sileo.success({
          title: 'Archetype updated',
        })
      } else {
        await createArchMut.mutateAsync(payload)

        sileo.success({
          title: 'Archetype created',
        })
      }

      setArchetypeModalOpen(false)
    } catch (err) {
      sileo.error({
        title:
          err instanceof Error
            ? err.message
            : 'Something went wrong',
      })
    }
  }

  const handleDeleteArchetype = async (
    id: number
  ) => {
    try {
      await deleteArchMut.mutateAsync(id)

      sileo.success({
        title: 'Archetype deleted',
      })
    } catch (err) {
      sileo.error({
        title:
          err instanceof Error
            ? err.message
            : 'Something went wrong',
      })
    }
  }

  // ============================================================
  // Product Attachment Helpers
  // ============================================================

  const openAttachProductModal = (
    archetypeId: number
  ) => {
    setTargetArchetypeId(archetypeId)

    setSelectedProductId('')

    setAttachModalOpen(true)
  }

  const handleAttachProduct = async () => {
    if (
      !targetArchetypeId ||
      !selectedProductId
    ) {
      return
    }

    try {
      await attachProductMut.mutateAsync({
        archetypeId: targetArchetypeId,
        productUlid: selectedProductId,
      })

      sileo.success({
        title: 'Product attached',
      })

      setAttachModalOpen(false)
    } catch (err) {
      sileo.error({
        title:
          err instanceof Error
            ? err.message
            : 'Something went wrong',
      })
    }
  }

  const handleDetachProduct = async (
    archetypeId: number,
    productUlid: string
  ) => {
    try {
      await detachProductMut.mutateAsync({
        archetypeId,
        productUlid,
      })

      sileo.success({
        title: 'Product detached',
      })
    } catch (err) {
      sileo.error({
        title:
          err instanceof Error
            ? err.message
            : 'Something went wrong',
      })
    }
  }

  // ============================================================
  // Settings Helpers
  // ============================================================

  const openSettingsTab = () => {
    const ar = getLocaleEntry(
      quiz.translations,
      'ar'
    ) as
      | {
        title?: string
        description?: string | null
      }
      | undefined

    const en = getLocaleEntry(
      quiz.translations,
      'en'
    ) as
      | {
        title?: string
        description?: string | null
      }
      | undefined

    setSettingsSlug(quiz.slug)

    setSettingsTitleAr(
      ar?.title || quiz.title || ''
    )

    setSettingsDescAr(
      ar?.description ||
      quiz.description ||
      ''
    )

    setSettingsTitleEn(en?.title || '')
    setSettingsDescEn(en?.description || '')

    const quizTypeId = getQuizTypeId(quiz.type)
    setSettingsType(String(quizTypeId || 1))
    setSettingsActive(quiz.active)

    setActiveTab('settings')
  }

  const handleSaveSettings = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault()

    try {
      await updateQuizMut.mutateAsync({
        slug: settingsSlug,

        type: Number(settingsType) || 1,

        active: settingsActive,

        translations: [
          { locale: 'ar', title: settingsTitleAr, description: settingsDescAr || null },
          ...(settingsTitleEn ? [{ locale: 'en', title: settingsTitleEn, description: settingsDescEn || null }] : []),
        ],
      })

      sileo.success({
        title: 'Quiz settings saved',
      })
    } catch (err) {
      sileo.error({
        title:
          err instanceof Error
            ? err.message
            : 'Something went wrong',
      })
    }
  }

  // ============================================================
  // JSX
  // ============================================================

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link
            href={`/${locale}/quizzes`}
            className="hover:underline flex items-center gap-1"
          >
            <ArrowLeft className="size-3.5" />
            Quizzes
          </Link>

          <span>/</span>

          <span>{quiz.slug}</span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              {quiz.title || 'Untitled Quiz'}
            </h1>

            {quiz.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {quiz.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant={
                quiz.active
                  ? 'default'
                  : 'secondary'
              }
            >
              {quiz.active
                ? 'Active'
                : 'Inactive'}
            </Badge>

            <Badge variant="outline">
              {getQuizTypeId(quiz.type) === 1
                ? 'Free'
                : 'Paid'}
            </Badge>

            <a
              href={`/${locale}/quiz/${quiz.slug}`}
              target="_blank"
              rel="noreferrer"
            >
              <Button
                size="sm"
                variant="outline"
              >
                <ExternalLink className="size-3.5 me-1" />
                View Public
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Tabs */}

      <div className="flex border-b gap-4">
        <button
          type="button"
          onClick={() =>
            setActiveTab('questions')
          }
          className={`py-2 px-1 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'questions'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
        >
          <HelpCircle className="size-4" />
          Questions (
          {quiz.questions?.length ?? 0})
        </button>

        <button
          type="button"
          onClick={() =>
            setActiveTab('archetypes')
          }
          className={`py-2 px-1 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'archetypes'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
        >
          <Award className="size-4" />
          Archetypes & Products (
          {quiz.archetypes?.length ?? 0})
        </button>

        <button
          type="button"
          onClick={openSettingsTab}
          className={`py-2 px-1 font-medium text-sm border-b-2 transition-colors ${activeTab === 'settings'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
        >
          Settings & Translations
        </button>
      </div>

      {/* ===================================================== */}
      {/* QUESTIONS TAB */}
      {/* ===================================================== */}

      {activeTab === 'questions' && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">
              Quiz Questions
            </h2>

            <Button
              onClick={openCreateQuestion}
              size="sm"
            >
              <Plus className="size-4 me-1" />
              Add Question
            </Button>
          </div>

          {!quiz.questions ||
            quiz.questions.length === 0 ? (
            <Card className="border-dashed p-8 text-center">
              <p className="text-muted-foreground mb-4">
                No questions added to this
                quiz yet.
              </p>

              <Button
                onClick={openCreateQuestion}
              >
                Add First Question
              </Button>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {quiz.questions
                .slice()
                .sort(
                  (a, b) =>
                    a.sort_order -
                    b.sort_order
                )
                .map((q, idx) => {
                  const isExpanded =
                    expandedQuestionId ===
                    q.id

                  return (
                    <Card
                      key={q.id}
                      className="overflow-hidden"
                    >
                      <CardHeader
                        className="p-4 bg-muted/30 flex flex-row items-center justify-between cursor-pointer"
                        onClick={() =>
                          setExpandedQuestionId(
                            isExpanded
                              ? null
                              : q.id
                          )
                        }
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-xs">
                            {idx + 1}
                          </span>

                          <span className="font-medium text-base">
                            {q.text ||
                              'Untitled Question'}
                          </span>

                          <span className="text-xs text-muted-foreground">
                            (
                            {q.answers
                              ?.length ??
                              0}{' '}
                            answers)
                          </span>
                        </div>

                        <div
                          className="flex items-center gap-2"
                          onClick={(e) =>
                            e.stopPropagation()
                          }
                        >
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              openEditQuestion(
                                q
                              )
                            }
                          >
                            <Edit className="size-3.5" />
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() =>
                              handleDeleteQuestion(
                                q.id
                              )
                            }
                          >
                            <Trash2 className="size-3.5" />
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              setExpandedQuestionId(
                                isExpanded
                                  ? null
                                  : q.id
                              )
                            }
                          >
                            {isExpanded ? (
                              <ChevronUp className="size-4" />
                            ) : (
                              <ChevronDown className="size-4" />
                            )}
                          </Button>
                        </div>
                      </CardHeader>

                      {isExpanded && (
                        <CardContent className="p-4 flex flex-col gap-3 border-t">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Answers & Scores
                            </span>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                openCreateAnswer(
                                  q.id
                                )
                              }
                            >
                              <Plus className="size-3.5 me-1" />
                              Add Answer
                            </Button>
                          </div>

                          {!q.answers ||
                            q.answers.length ===
                            0 ? (
                            <p className="text-xs text-muted-foreground italic py-2">
                              No answers
                              configured for
                              this question.
                            </p>
                          ) : (
                            <div className="flex flex-col gap-2">
                              {q.answers
                                .slice()
                                .sort(
                                  (a, b) =>
                                    a.sort_order -
                                    b.sort_order
                                )
                                .map(
                                  (ans) => (
                                    <div
                                      key={
                                        ans.id
                                      }
                                      className="flex items-center justify-between p-2.5 rounded-md border bg-card text-sm"
                                    >
                                      <div className="flex items-center gap-3 min-w-0">
                                        <Badge
                                          variant="outline"
                                          className="font-mono text-xs shrink-0"
                                        >
                                          Score: +
                                          {
                                            ans.score
                                          }
                                        </Badge>

                                        <span className="truncate">
                                          {ans.text}
                                        </span>

                                        {ans.tags &&
                                          ans
                                            .tags
                                            .length >
                                          0 && (
                                            <div className="flex gap-1 shrink-0">
                                              {ans.tags.map(
                                                (
                                                  tag
                                                ) => (
                                                  <Badge
                                                    key={
                                                      tag
                                                    }
                                                    variant="secondary"
                                                    className="text-[10px]"
                                                  >
                                                    {
                                                      tag
                                                    }
                                                  </Badge>
                                                )
                                              )}
                                            </div>
                                          )}
                                      </div>

                                      <div className="flex items-center gap-1 shrink-0">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() =>
                                            openEditAnswer(
                                              q.id,
                                              ans
                                            )
                                          }
                                        >
                                          <Edit className="size-3" />
                                        </Button>

                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="text-destructive"
                                          onClick={() =>
                                            handleDeleteAnswer(
                                              q.id,
                                              ans.id
                                            )
                                          }
                                        >
                                          <Trash2 className="size-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  )
                                )}
                            </div>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  )
                })}
            </div>
          )}
        </div>
      )}

      {/* ===================================================== */}
      {/* ARCHETYPES TAB */}
      {/* ===================================================== */}

      {activeTab === 'archetypes' && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">
                Result Archetypes
              </h2>

              <p className="text-xs text-muted-foreground">
                Define personality/result
                tiers based on final score
                ranges.
              </p>
            </div>

            <Button
              onClick={
                openCreateArchetype
              }
              size="sm"
            >
              <Plus className="size-4 me-1" />
              Add Archetype
            </Button>
          </div>

          {!quiz.archetypes ||
            quiz.archetypes.length ===
            0 ? (
            <Card className="border-dashed p-8 text-center">
              <p className="text-muted-foreground mb-4">
                No result archetypes
                defined for this quiz yet.
              </p>

              <Button
                onClick={
                  openCreateArchetype
                }
              >
                Add First Archetype
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quiz.archetypes.map(
                (arch) => (
                  <Card
                    key={arch.id}
                    className="flex flex-col justify-between"
                  >
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Award className="size-4 text-primary" />
                            {arch.name}
                          </CardTitle>

                          <CardDescription className="text-xs font-mono">
                            Slug: {arch.slug} |
                            Score:{' '}
                            {
                              arch.min_score
                            }{' '}
                            –{' '}
                            {
                              arch.max_score
                            }
                          </CardDescription>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              openEditArchetype(
                                arch
                              )
                            }
                          >
                            <Edit className="size-3.5" />
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() =>
                              handleDeleteArchetype(
                                arch.id
                              )
                            }
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 pt-0 flex flex-col gap-3">
                      {arch.headline && (
                        <p className="text-sm font-medium text-primary">
                          {arch.headline}
                        </p>
                      )}

                      {arch.description && (
                        <p className="text-xs text-muted-foreground line-clamp-3">
                          {arch.description}
                        </p>
                      )}

                      {/* Attached Products */}

                      <div className="border-t pt-3 mt-2 flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold flex items-center gap-1">
                            <Package className="size-3.5" />
                            Recommended
                            Products (
                            {
                              arch.products
                                ?.length ??
                              0
                            }
                            )
                          </span>

                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() =>
                              openAttachProductModal(
                                arch.id
                              )
                            }
                          >
                            + Attach Product
                          </Button>
                        </div>

                        {arch.products &&
                          arch.products.length >
                          0 ? (
                          <div className="flex flex-col gap-1.5">
                            {arch.products.map((prod) => (
                              <div
                                key={prod.ulid}
                                className="flex items-center justify-between p-2 rounded border bg-muted/20 text-xs"
                              >
                                <span className="font-medium truncate max-w-[200px]">
                                  {prod.name || prod.internal_name}
                                </span>

                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-muted-foreground">
                                    {prod.base_price} {prod.currency}
                                  </span>

                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 text-destructive"
                                    onClick={() =>
                                      handleDetachProduct(
                                        arch.id,
                                        prod.ulid
                                      )
                                    }
                                  >
                                    ×
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-muted-foreground italic">
                            No products attached
                            to this archetype.
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          )}
        </div>
      )}

      {/* ===================================================== */}
      {/* SETTINGS TAB */}
      {/* ===================================================== */}

      {activeTab === 'settings' && (
        <Card className="p-6">
          <form
            onSubmit={handleSaveSettings}
            className="flex flex-col gap-4 max-w-xl"
          >
            <h2 className="text-lg font-semibold">
              Quiz Settings &
              Translations
            </h2>

            <div className="flex flex-col gap-1.5">
              <Label>Slug *</Label>

              <Input
                value={settingsSlug}
                onChange={(e) =>
                  setSettingsSlug(
                    e.target.value
                  )
                }
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>
                Title (Arabic) *
              </Label>

              <Input
                value={settingsTitleAr}
                onChange={(e) =>
                  setSettingsTitleAr(
                    e.target.value
                  )
                }
                required
                dir="rtl"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>
                Description (Arabic)
              </Label>

              <Textarea
                value={settingsDescAr}
                onChange={(e) =>
                  setSettingsDescAr(
                    e.target.value
                  )
                }
                dir="rtl"
                rows={3}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>
                Title (English)
              </Label>

              <Input
                value={settingsTitleEn}
                onChange={(e) =>
                  setSettingsTitleEn(
                    e.target.value
                  )
                }
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>
                Description (English)
              </Label>

              <Textarea
                value={settingsDescEn}
                onChange={(e) =>
                  setSettingsDescEn(
                    e.target.value
                  )
                }
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Type</Label>

                <Select
                  value={settingsType}
                  onValueChange={(value) => {
                    if (value) {
                      setSettingsType(
                        value
                      )
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="1">
                      Free
                    </SelectItem>

                    <SelectItem value="2">
                      Paid
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 pt-6">
                <Switch
                  id="settings-active"
                  checked={
                    settingsActive
                  }
                  onCheckedChange={
                    setSettingsActive
                  }
                />

                <Label htmlFor="settings-active">
                  Active
                </Label>
              </div>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                disabled={
                  updateQuizMut.isPending
                }
              >
                {updateQuizMut.isPending
                  ? 'Saving…'
                  : 'Save Quiz Settings'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ===================================================== */}
      {/* QUESTION MODAL */}
      {/* ===================================================== */}

      <Dialog
        open={questionModalOpen}
        onOpenChange={
          setQuestionModalOpen
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingQuestion
                ? 'Edit Question'
                : 'Add Question'}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={
              handleSaveQuestion
            }
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1.5">
              <Label>
                Question Text (Arabic) *
              </Label>

              <Input
                value={qTextAr}
                onChange={(e) =>
                  setQTextAr(
                    e.target.value
                  )
                }
                required
                dir="rtl"
                placeholder="ما هو هدفك الرئيسي؟"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>
                Question Text (English)
              </Label>

              <Input
                value={qTextEn}
                onChange={(e) =>
                  setQTextEn(
                    e.target.value
                  )
                }
                placeholder="What is your primary goal?"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Question Type</Label>

                <Select
                  value={qType}
                  onValueChange={(value) => {
                    if (value) {
                      setQType(value)
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="1">
                      Single Choice
                    </SelectItem>

                    <SelectItem value="2">
                      Multiple Choice
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Sort Order</Label>

                <Input
                  type="number"
                  min={0}
                  value={qSortOrder}
                  onChange={(e) =>
                    setQSortOrder(
                      Number(
                        e.target.value
                      )
                    )
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setQuestionModalOpen(
                    false
                  )
                }
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={
                  createQMut.isPending ||
                  updateQMut.isPending
                }
              >
                Save Question
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ===================================================== */}
      {/* ANSWER MODAL */}
      {/* ===================================================== */}

      <Dialog
        open={answerModalOpen}
        onOpenChange={
          setAnswerModalOpen
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAnswer
                ? 'Edit Answer'
                : 'Add Answer'}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSaveAnswer}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1.5">
              <Label>
                Answer Text (Arabic) *
              </Label>

              <Input
                value={aTextAr}
                onChange={(e) =>
                  setATextAr(
                    e.target.value
                  )
                }
                required
                dir="rtl"
                placeholder="زيادة المبيعات"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>
                Answer Text (English)
              </Label>

              <Input
                value={aTextEn}
                onChange={(e) =>
                  setATextEn(
                    e.target.value
                  )
                }
                placeholder="Increase Sales"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>
                  Score Points
                </Label>

                <Input
                  type="number"
                  step={1}
                  value={aScore}
                  onChange={(e) =>
                    setAScore(
                      Number(
                        e.target.value
                      )
                    )
                  }
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>
                  Sort Order
                </Label>

                <Input
                  type="number"
                  min={0}
                  value={aSortOrder}
                  onChange={(e) =>
                    setASortOrder(
                      Number(
                        e.target.value
                      )
                    )
                  }
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>
                Tags (comma-separated,
                optional)
              </Label>

              <Input
                value={aTags}
                onChange={(e) =>
                  setATags(
                    e.target.value
                  )
                }
                placeholder="growth, ecommerce"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setAnswerModalOpen(
                    false
                  )
                }
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={
                  createAMut.isPending ||
                  updateAMut.isPending
                }
              >
                Save Answer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ===================================================== */}
      {/* ARCHETYPE MODAL */}
      {/* ===================================================== */}

      <Dialog
        open={archetypeModalOpen}
        onOpenChange={
          setArchetypeModalOpen
        }
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingArchetype
                ? 'Edit Archetype'
                : 'Add Archetype'}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={
              handleSaveArchetype
            }
            className="flex flex-col gap-4"
          >
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Slug *</Label>

                <Input
                  value={archSlug}
                  onChange={(e) =>
                    setArchSlug(
                      e.target.value
                    )
                  }
                  required
                  placeholder="growth-master"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Min Score</Label>

                <Input
                  type="number"
                  value={archMinScore}
                  onChange={(e) =>
                    setArchMinScore(
                      Number(
                        e.target.value
                      )
                    )
                  }
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Max Score</Label>

                <Input
                  type="number"
                  value={archMaxScore}
                  onChange={(e) =>
                    setArchMaxScore(
                      Number(
                        e.target.value
                      )
                    )
                  }
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>
                Name (Arabic) *
              </Label>

              <Input
                value={archNameAr}
                onChange={(e) =>
                  setArchNameAr(
                    e.target.value
                  )
                }
                required
                dir="rtl"
                placeholder="خبير النمو"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>
                Headline (Arabic)
              </Label>

              <Input
                value={archHeadlineAr}
                onChange={(e) =>
                  setArchHeadlineAr(
                    e.target.value
                  )
                }
                dir="rtl"
                placeholder="أنت خبير في توسيع الأعمال!"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>
                Description (Arabic)
              </Label>

              <Textarea
                value={archDescAr}
                onChange={(e) =>
                  setArchDescAr(
                    e.target.value
                  )
                }
                dir="rtl"
                rows={2}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>
                Name (English)
              </Label>

              <Input
                value={archNameEn}
                onChange={(e) =>
                  setArchNameEn(
                    e.target.value
                  )
                }
                placeholder="Growth Master"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>
                Headline (English)
              </Label>

              <Input
                value={archHeadlineEn}
                onChange={(e) =>
                  setArchHeadlineEn(
                    e.target.value
                  )
                }
                placeholder="You excel at scaling business!"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>
                Description (English)
              </Label>

              <Textarea
                value={archDescEn}
                onChange={(e) =>
                  setArchDescEn(
                    e.target.value
                  )
                }
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setArchetypeModalOpen(
                    false
                  )
                }
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={
                  createArchMut.isPending ||
                  updateArchMut.isPending
                }
              >
                Save Archetype
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ===================================================== */}
      {/* ATTACH PRODUCT MODAL */}
      {/* ===================================================== */}

      <Dialog
        open={attachModalOpen}
        onOpenChange={
          setAttachModalOpen
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Attach Product to Archetype
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>
                Select Product
              </Label>

              <Select
                value={selectedProductId}
                onValueChange={(value) =>
                  setSelectedProductId(
                    value ?? ''
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose product..." />
                </SelectTrigger>

                <SelectContent className="max-h-60">
                  {allProducts.map((product) => (
                    <SelectItem
                      key={product.ulid}
                      value={product.ulid}
                    >
                      {product.name || product.internal_name} ({product.base_price} {product.currency})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() =>
                  setAttachModalOpen(
                    false
                  )
                }
              >
                Cancel
              </Button>

              <Button
                onClick={
                  handleAttachProduct
                }
                disabled={
                  !selectedProductId ||
                  attachProductMut.isPending
                }
              >
                {attachProductMut.isPending
                  ? 'Attaching…'
                  : 'Attach Product'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}