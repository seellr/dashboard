import { adminFetchServer } from '@/lib/admin/api-server'
import { QuizBuilderClient } from '@/components/admin/quizzes/QuizBuilderClient'
import type { Quiz } from '@/types/dto/quiz.dto'

export default async function QuizBuilderPage({ params }: { params: Promise<{ locale: string; ulid: string }> }) {
  const { locale, ulid } = await params

  const result = await adminFetchServer<Quiz>(`/admin/quizzes/${ulid}`)
  const initialQuiz = result.ok ? result.data : null

  return (
    <div className="flex flex-col gap-6">
      <QuizBuilderClient locale={locale} ulid={ulid} initialQuiz={initialQuiz} />
    </div>
  )
}
