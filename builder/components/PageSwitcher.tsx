'use client'

import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { subscriberThemeApi } from '@/api/client'
import { builderPageSchema } from '@/shared/schemas/builder'
import { useEditorStore } from '@/builder/store/editor-store'
import { useBuilderPages } from '@/builder/hooks/useBuilderData'
import type { BuilderPage, PageType } from '@/shared/types/builder'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const pages: Array<{ value: PageType; label: string }> = [
  { value: 'home', label: 'Home' },
  { value: 'product', label: 'Product' },
  { value: 'product_list', label: 'Product list' },
  { value: 'cart', label: 'Cart' },
  { value: 'account', label: 'Account' },
  { value: 'not_found', label: '404 / Not found' },
  { value: 'header', label: 'Header' },
  { value: 'footer', label: 'Footer' },
  { value: 'lead_magnet', label: 'Lead magnet' },
  { value: 'tripwire', label: 'Tripwire' },
  { value: 'oto', label: 'One-time offer' },
  { value: 'downsell', label: 'Downsell' },
  { value: 'thank_you', label: 'Thank you' },
  { value: 'custom', label: 'Custom page' },
]

export function PageSwitcher() {
  const locale = useEditorStore((state) => state.locale)
  const page = useEditorStore((state) => state.page)
  const setPage = useEditorStore((state) => state.setPage)
  const pagesQuery = useBuilderPages(locale)
  const queryClient = useQueryClient()
  const [switching, setSwitching] = useState(false)

  const availableTypes = useMemo(
    () => new Set((pagesQuery.data ?? []).map((item) => item.type)),
    [pagesQuery.data],
  )

  /**
   * Loads the selected page's draft. The list endpoint may omit sections, so
   * when that happens we fetch the draft imperatively (instead of wiring a
   * query + effect, which would call setState during render).
   */
  const switchPage = async (match: BuilderPage) => {
    if (match.sections?.length) {
      setPage(match)
      return
    }
    setSwitching(true)
    try {
      const draft = await queryClient.fetchQuery({
        queryKey: ['builder-draft', locale, match.ulid],
        queryFn: async () => {
          const response = await subscriberThemeApi.getDraft(locale, match.ulid)
          const parsed = builderPageSchema.safeParse(response.data)
          if (!parsed.success) throw new Error('Invalid draft response')
          return parsed.data as BuilderPage
        },
      })
      setPage(draft)
    } catch {
      setPage(match)
    } finally {
      setSwitching(false)
    }
  }

  const value = page.type === '404' ? 'not_found' : page.type

  return (
    <Select
      value={value}
      disabled={switching}
      onValueChange={(next) => {
        if (!next) return
        const type = next as PageType
        if (type === page.type) return
        const match = pagesQuery.data?.find((item) => item.type === type)
        if (!match) return
        void switchPage(match)
      }}
    >
      <SelectTrigger className="w-44" aria-label="Select page">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {pages.map((item) => (
          <SelectItem
            key={item.value}
            value={item.value}
            disabled={!availableTypes.has(item.value) && item.value !== value}
          >
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
