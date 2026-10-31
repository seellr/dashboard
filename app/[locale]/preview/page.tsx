import { PreviewPageClient } from '@/builder/components/PreviewPageClient'

export default async function PreviewPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return <PreviewPageClient initialLocale={locale === 'ar' ? 'ar' : 'en'} />
}
