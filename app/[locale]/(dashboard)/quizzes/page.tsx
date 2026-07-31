import { adminFetchServer } from '@/lib/admin/api-server'
import { QuizzesClient } from '@/components/admin/quizzes/QuizzesClient'

interface Quiz {
  ulid: string
  slug: string
  type: number
  active: boolean
  title: string
  description: string | null
  created_at: string
}

export default async function AdminQuizzesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  const result = await adminFetchServer<Quiz[]>('/admin/quizzes')
  const items = result.ok ? result.data : []

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Quizzes</h1>
      <QuizzesClient locale={locale} initialItems={items} />
    </div>
  )
}
