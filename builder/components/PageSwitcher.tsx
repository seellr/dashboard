'use client'

import { useEditorStore } from '@/builder/store/editor-store'
import type { PageType } from '@/shared/types/builder'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const pages: PageType[] = ['home', 'product', 'product_list', 'cart', 'account', '404', 'header', 'footer', 'lead_magnet', 'tripwire', 'oto', 'downsell', 'thank_you', 'custom']

export function PageSwitcher() {
  const page = useEditorStore((state) => state.page)
  const setPage = useEditorStore((state) => state.setPage)
  return <Select value={page.type} onValueChange={(value) => { if (value) setPage({ ...page, type: value as PageType, name: { ar: value, en: value } }) }}><SelectTrigger className="w-44" aria-label="Select page"><SelectValue /></SelectTrigger><SelectContent>{pages.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select>
}
