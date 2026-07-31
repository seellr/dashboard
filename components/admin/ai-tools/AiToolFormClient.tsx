'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminFetchClient } from '@/lib/admin/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { sileo } from 'sileo'

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

interface Props {
  existing: AiTool | null
  ulid: string
  onSuccess?: () => void
}

export function AiToolFormClient({ existing, ulid, onSuccess }: Props) {
  const router = useRouter()
  const isNew = ulid === 'new'

  const [slug, setSlug] = useState(existing?.slug ?? '')
  const [nameAr, setNameAr] = useState(existing?.name ?? '')
  const [nameEn, setNameEn] = useState('')
  const [promptTemplate, setPromptTemplate] = useState(existing?.prompt_template ?? '')
  const [openrouterModel, setOpenrouterModel] = useState(existing?.openrouter_model ?? 'anthropic/claude-sonnet-4-5')
  const [maxTokens, setMaxTokens] = useState(existing?.max_tokens ?? 512)
  const [rateLimitPerDay, setRateLimitPerDay] = useState(existing?.rate_limit_per_day ?? 10)
  const [active, setActive] = useState(existing?.active ?? true)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const body: Record<string, unknown> = {
      brand_id: 1,
      prompt_template: promptTemplate,
      openrouter_model: openrouterModel,
      max_tokens: maxTokens,
      rate_limit_per_day: rateLimitPerDay,
      active,
      translations: [
        { locale: 'ar', name: nameAr },
        ...(nameEn ? [{ locale: 'en', name: nameEn }] : []),
      ],
    }

    if (isNew) {
      body.slug = slug
    }

    const path = isNew ? '/ai-tools' : `/ai-tools/${ulid}`
    const method = isNew ? 'POST' : 'PUT'

    const result = await adminFetchClient(path, {
      method,
      body: JSON.stringify(body),
    })

    setSaving(false)

    if (!result.ok) {
      sileo.error({ title: result.message })
      return
    }

    sileo.success({ title: isNew ? 'AI Tool created' : 'AI Tool updated' })
    if (onSuccess) {
      onSuccess()
    } else {
      router.back()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-xl">
        {isNew && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              placeholder="e.g. product-description"
            />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nameAr">Name (AR) *</Label>
          <Input
            id="nameAr"
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
            required
            placeholder="اسم الأداة"
            dir="rtl"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nameEn">Name (EN)</Label>
          <Input
            id="nameEn"
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            placeholder="Tool name"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="promptTemplate">Prompt Template *</Label>
          <Textarea
            id="promptTemplate"
            value={promptTemplate}
            onChange={(e) => setPromptTemplate(e.target.value)}
            required
            rows={6}
            placeholder="You are a helpful assistant..."
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="openrouterModel">OpenRouter Model</Label>
          <Input
            id="openrouterModel"
            value={openrouterModel}
            onChange={(e) => setOpenrouterModel(e.target.value)}
            placeholder="anthropic/claude-sonnet-4-5"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="maxTokens">Max Tokens</Label>
            <Input
              id="maxTokens"
              type="number"
              value={maxTokens}
              onChange={(e) => setMaxTokens(Number(e.target.value))}
              min={1}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rateLimit">Rate Limit / Day</Label>
            <Input
              id="rateLimit"
              type="number"
              value={rateLimitPerDay}
              onChange={(e) => setRateLimitPerDay(Number(e.target.value))}
              min={1}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Switch id="active" checked={active} onCheckedChange={setActive} />
          <Label htmlFor="active">Active</Label>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : isNew ? 'Create' : 'Update'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
  )
}
