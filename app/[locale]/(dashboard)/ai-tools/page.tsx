import { adminFetchServer } from '@/lib/admin/api-server'
import { AiToolsClient } from '@/components/admin/ai-tools/AiToolsClient'

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

export default async function AdminAiToolsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  const result = await adminFetchServer<AiTool[]>('/admin/ai-tools')
  const items = result.ok ? result.data : []

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">AI Tools</h1>
      <AiToolsClient locale={locale} initialItems={items} />
    </div>
  )
}
