import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { adminFetchServer } from '@/lib/admin/api-server'
import { getQueryClient } from '@/lib/admin/query-client'
import { AiToolFormClient } from '@/components/admin/ai-tools/AiToolFormClient'
import type { AiTool } from '@/types/dto/ai-tool.dto'

export default async function AdminAiToolFormPage({
  params,
}: {
  params: Promise<{ locale: string; ulid: string }>
}) {
  const { ulid } = await params
  const queryClient = getQueryClient()

  let existing: AiTool | null = null
  if (ulid !== 'new') {
    const result = await adminFetchServer<AiTool>(`/admin/ai-tools/${ulid}`)
    if (result.ok) {
      existing = result.data
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">{ulid === 'new' ? 'New AI Tool' : 'Edit AI Tool'}</h1>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <AiToolFormClient existing={existing} ulid={ulid} />
      </HydrationBoundary>
    </div>
  )
}
