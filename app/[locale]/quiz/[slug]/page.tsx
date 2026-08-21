import { QuizTakerClient } from '@/components/public/QuizTakerClient'

export default async function PublicQuizPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <QuizTakerClient locale={locale} slug={slug} />
      </div>
    </div>
  )
}
