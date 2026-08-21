'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { sileo } from 'sileo'
import { Award, ArrowRight, ArrowLeft, CheckCircle2, ShoppingBag, Mail, Sparkles } from 'lucide-react'
import { usePublicQuizQuery, useSubmitQuizMutation } from '@/hooks/queries/useQuizzes'
import { getQuizTypeId, getQuestionTypeId } from '@/types/dto/quiz.dto'
import type { QuizQuestion, QuizAnswer, QuizSubmissionResult } from '@/types/dto/quiz.dto'

interface Props {
  locale: string
  slug: string
}

export function QuizTakerClient({ locale, slug }: Props) {
  const isRtl = locale === 'ar'
  const { data: quiz, isLoading, error } = usePublicQuizQuery(slug)
  const submitMutation = useSubmitQuizMutation(slug)

  // State
  const [step, setStep] = useState<'intro' | 'questions' | 'email' | 'result'>('intro')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number[]>>({}) // questionId -> answerIds
  const [email, setEmail] = useState('')
  const [resultData, setResultData] = useState<QuizSubmissionResult | null>(null)

  if (isLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-8 w-3/4 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3 mb-6" />
        <Skeleton className="h-12 w-full mb-3" />
        <Skeleton className="h-12 w-full mb-3" />
      </Card>
    )
  }

  if (error || !quiz) {
    return (
      <Card className="p-8 text-center border-destructive">
        <h2 className="text-xl font-bold text-destructive mb-2">Quiz Not Found</h2>
        <p className="text-sm text-muted-foreground">The requested quiz could not be loaded or is inactive.</p>
      </Card>
    )
  }

  const questions: QuizQuestion[] = (quiz.questions || []).slice().sort((a, b) => a.sort_order - b.sort_order)
  const currentQuestion = questions[currentQuestionIndex]

  // Handlers
  const handleToggleAnswer = (questionId: number, answerId: number, isMulti: boolean) => {
    setSelectedAnswers((prev) => {
      const current = prev[questionId] || []
      if (isMulti) {
        return {
          ...prev,
          [questionId]: current.includes(answerId)
            ? current.filter((id) => id !== answerId)
            : [...current, answerId],
        }
      }
      return { ...prev, [questionId]: [answerId] }
    })
  }

  const handleNextQuestion = () => {
    const currentAnswers = selectedAnswers[currentQuestion.id] || []
    if (currentAnswers.length === 0) {
      sileo.error({ title: isRtl ? 'يرجى اختيار إجابة للمتابعة' : 'Please select an answer to proceed' })
      return
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    } else {
      setStep('email')
    }
  }

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
    } else {
      setStep('intro')
    }
  }

  const handleSubmitQuiz = async (e: React.FormEvent) => {
    e.preventDefault()

    const submissionAnswers = Object.entries(selectedAnswers).map(([qId, aIds]) => ({
      question_id: Number(qId),
      answer_ids: aIds,
    }))
    try {
      const res = await submitMutation.mutateAsync({
        answers: submissionAnswers,
        email: email || undefined,
      })
      setResultData(res)
      setStep('result')
    } catch (err) {
      sileo.error({ title: (err as Error).message || 'Failed to calculate quiz result' })
    }
  }

  // ================= INTRO SCREEN =================
  if (step === 'intro') {
    return (
      <Card className="shadow-lg border-muted/50 overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-8 text-center flex flex-col items-center gap-4">
          <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
            <Sparkles className="size-8" />
          </div>

          <Badge variant="outline" className="text-xs uppercase tracking-wider">
            {getQuizTypeId(quiz.type) === 1 ? (isRtl ? 'اختبار مجاني' : 'Free Assessment') : (isRtl ? 'اختبار مدفوع' : 'Paid Assessment')}
          </Badge>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{quiz.title}</h1>

          {quiz.description && (
            <p className="text-muted-foreground text-sm sm:text-base max-w-lg leading-relaxed">{quiz.description}</p>
          )}

          <div className="pt-4 w-full max-w-xs">
            <Button size="lg" className="w-full font-semibold gap-2 shadow" onClick={() => setStep('questions')}>
              {isRtl ? 'ابدأ الاختبار الآن' : 'Start Quiz Now'}
              {isRtl ? <ArrowLeft className="size-4" /> : <ArrowRight className="size-4" />}
            </Button>
          </div>
        </div>

        <CardFooter className="p-4 bg-muted/20 border-t justify-center text-xs text-muted-foreground">
          {questions.length} {isRtl ? 'أسئلة • يستغرق 2 دقيقة' : 'Questions • Takes 2 mins'}
        </CardFooter>
      </Card>
    )
  }

  // ================= QUESTIONS SCREEN =================
  if (step === 'questions' && currentQuestion) {
    const progressPercent = Math.round(((currentQuestionIndex + 1) / questions.length) * 100)
    const answers: QuizAnswer[] = (currentQuestion.answers || []).slice().sort((a, b) => a.sort_order - b.sort_order)
    const isMulti = getQuestionTypeId(currentQuestion.type) === 2
    const selectedAnswerIds = selectedAnswers[currentQuestion.id] || []

    return (
      <Card className="shadow-lg border-muted/50">
        {/* Progress Bar */}
        <div className="w-full bg-muted h-2">
          <div className="bg-primary h-2 transition-all duration-300" style={{ width: `${progressPercent}%` }} />
        </div>

        <CardHeader className="p-6 pb-2">
          <div className="flex justify-between items-center text-xs text-muted-foreground mb-2">
            <span>
              {isRtl ? `السؤال ${currentQuestionIndex + 1} من ${questions.length}` : `Question ${currentQuestionIndex + 1} of ${questions.length}`}
            </span>
            <span>{progressPercent}%</span>
          </div>

          <CardTitle className="text-xl sm:text-2xl font-bold leading-snug">{currentQuestion.text}</CardTitle>
        </CardHeader>

        <CardContent className="p-6 flex flex-col gap-3">
          {answers.map((ans) => {
            const isSelected = selectedAnswerIds.includes(ans.id)
            return (
              <button
                key={ans.id}
                type="button"
                onClick={() => handleToggleAnswer(currentQuestion.id, ans.id, isMulti)}
                className={`w-full p-4 rounded-xl border text-start transition-all flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20 shadow-sm font-medium'
                    : 'border-muted hover:border-primary/50 hover:bg-accent/50 text-foreground'
                }`}
              >
                <span>{ans.text}</span>
                {isSelected && <CheckCircle2 className="size-5 text-primary shrink-0" />}
              </button>
            )
          })}
        </CardContent>

        <CardFooter className="p-6 pt-2 border-t flex justify-between">
          <Button variant="ghost" onClick={handlePrevQuestion}>
            {isRtl ? <ArrowRight className="size-4 me-1" /> : <ArrowLeft className="size-4 me-1" />}
            {isRtl ? 'السابق' : 'Previous'}
          </Button>

          <Button onClick={handleNextQuestion} disabled={selectedAnswerIds.length === 0}>
            {isRtl ? 'التالي' : 'Next'}
            {isRtl ? <ArrowLeft className="size-4 ms-1" /> : <ArrowRight className="size-4 ms-1" />}
          </Button>
        </CardFooter>
      </Card>
    )
  }

  // ================= EMAIL COLLECTION STEP =================
  if (step === 'email') {
    return (
      <Card className="shadow-lg border-muted/50">
        <CardHeader className="p-6 text-center">
          <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto mb-3">
            <Mail className="size-6" />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold">
            {isRtl ? 'أدخل بريدك الإلكتروني لعرض النتيجة' : 'Enter Your Email to Get Results'}
          </CardTitle>
          <CardDescription>
            {isRtl ? 'سنقوم بإرسال النتيجة والتوصيات المخصصة لك مباشرة.' : 'We will calculate your archetype and send recommendations.'}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmitQuiz}>
          <CardContent className="p-6 pt-0 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="quiz-email">{isRtl ? 'البريد الإلكتروني' : 'Email Address'}</Label>
              <Input
                id="quiz-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="h-11"
              />
            </div>
          </CardContent>

          <CardFooter className="p-6 pt-2 border-t flex justify-between">
            <Button type="button" variant="ghost" onClick={() => setStep('questions')}>
              {isRtl ? 'تعديل الإجابات' : 'Back to Questions'}
            </Button>

            <Button type="submit" size="lg" disabled={submitMutation.isPending}>
              {submitMutation.isPending
                ? isRtl
                  ? 'جاري التحليل…'
                  : 'Analyzing…'
                : isRtl
                ? 'عرض النتيجة'
                : 'See My Results'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    )
  }

  // ================= RESULTS SCREEN =================
  if (step === 'result' && resultData) {
    const archetype = resultData.archetype
    const products = resultData.products || archetype?.products || []

    return (
      <Card className="shadow-xl border-primary/20 overflow-hidden">
        {/* Result Banner */}
        <div className="bg-gradient-to-br from-primary/15 via-primary/5 to-background p-8 text-center flex flex-col items-center gap-3 border-b">
          <div className="size-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg mb-1">
            <Award className="size-8" />
          </div>

          <Badge variant="outline" className="text-xs uppercase tracking-widest border-primary/40 text-primary">
            {isRtl ? 'النتيجة الخاصة بك' : 'Your Result Archetype'}
          </Badge>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground">{archetype?.name || 'Your Result'}</h1>

          {archetype?.headline && <p className="text-base sm:text-lg font-semibold text-primary">{archetype.headline}</p>}
        </div>

        <CardContent className="p-6 sm:p-8 flex flex-col gap-6">
          {/* Description */}
          {archetype?.description && (
            <div className="bg-card p-5 rounded-xl border text-sm leading-relaxed text-muted-foreground shadow-sm">
              {archetype.description}
            </div>
          )}

          {/* Recommended Products Section */}
          {products.length > 0 && (
            <div className="flex flex-col gap-4 pt-2">
              <div className="flex items-center gap-2">
                <ShoppingBag className="size-5 text-primary" />
                <h3 className="text-lg font-bold">{isRtl ? 'التوصيات المخصصة لك' : 'Recommended Solutions'}</h3>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {products.map((prod) => (
                  <div
                    key={prod.ulid}
                    className="p-5 rounded-xl border bg-card hover:border-primary/50 transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-base">{prod.name || prod.internal_name}</span>
                      {prod.one_liner && <span className="text-xs text-muted-foreground line-clamp-2">{prod.one_liner}</span>}
                      <span className="text-sm font-bold text-primary pt-1">
                        {prod.base_price} {prod.currency}
                      </span>
                    </div>

                    <Link href={`/${locale}/products`}>
                      <Button size="sm" className="shrink-0 shadow-sm">
                        {isRtl ? 'عرض التفاصيل' : 'View Product'}
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="p-6 bg-muted/20 border-t justify-center">
          <Button
            variant="outline"
            onClick={() => {
              setStep('intro')
              setCurrentQuestionIndex(0)
              setSelectedAnswers({})
              setResultData(null)
            }}
          >
            {isRtl ? 'إعادة الاختبار' : 'Retake Quiz'}
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return null
}
