import { QuizResultClient } from '@/components/public/QuizResultClient'

export default async function PublicQuizResultPage({ params }: { params: Promise<{ locale: string; ulid: string }> }) {
  const { locale, ulid } = await params

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <QuizResultClient locale={locale} ulid={ulid} />
      </div>
    </div>
  )
}
