import { adminFetchServer } from '@/lib/admin/api-server'
import { AutomationRulesClient } from '@/components/admin/automation/AutomationRulesClient'
import type { AutomationRule } from '@/components/admin/automation/AutomationRulesClient'

export default async function AdminAutomationPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  const result = await adminFetchServer<AutomationRule[]>('/admin/automation-rules')
  const rules = result.ok ? result.data : []

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Automation Rules</h1>
      <AutomationRulesClient locale={locale} initialRules={rules} />
    </div>
  )
}
