'use client'

import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BlocksEditor } from '@/builder/components/BlocksEditor'
import { SettingsFields, type SettingsFormValues } from '@/builder/components/SettingsFields'
import { commitSetting, flattenSettings, settingFieldName } from '@/builder/lib/settings-form'
import { useEditorStore } from '@/builder/store/editor-store'
import { listSellerProducts, type SellerProduct } from '@/lib/seller/resource-client'

function useSellerProducts() {
  return useQuery({
    queryKey: ['builder-seller-products'],
    queryFn: async (): Promise<SellerProduct[]> => {
      const result = await listSellerProducts('?per_page=100')
      return result.ok ? result.data.items : []
    },
    staleTime: 60_000,
  })
}

export function SettingsPanel() {
  const section = useEditorStore((state) => state.page.sections.find((item) => item.id === state.selectedSectionId))
  const schema = useEditorStore((state) => state.schema)
  const localeTab = useEditorStore((state) => state.localeTab)
  const setLocaleTab = useEditorStore((state) => state.setLocaleTab)
  const update = useEditorStore((state) => state.updateSectionSettings)
  const { data: products = [] } = useSellerProducts()

  const definition = useMemo(
    () => schema.sections.find((item) => item.handle === section?.type),
    [schema.sections, section?.type],
  )
  const definitionList = useMemo(() => definition?.settings ?? [], [definition])
  const form = useForm<SettingsFormValues>({
    defaultValues: section ? flattenSettings(section.settings, definitionList, localeTab) : {},
  })

  const sectionId = section?.id ?? null
  useEffect(() => {
    if (!section) return
    form.reset(flattenSettings(section.settings, definitionList, localeTab))
    // Re-seed only when switching section or locale: resetting on every settings
    // change used to fight the user while typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionId, definitionList, localeTab, form])

  if (!section) {
    return (
      <aside className="w-80 shrink-0 border-s p-5 text-sm text-muted-foreground">
        Select a section to edit its settings.
      </aside>
    )
  }

  const commitField = (fieldName: string, value: unknown) => {
    const target = definitionList.find((item) => settingFieldName(item, localeTab) === fieldName)
    if (!target) return
    // Read the latest values from the store so two quick edits cannot clobber
    // each other through a stale render closure.
    const latest = useEditorStore.getState().page.sections.find((item) => item.id === section.id)
    update(section.id, commitSetting(latest?.settings ?? section.settings, target, value, localeTab))
  }

  const hasTranslatable =
    definitionList.some((item) => item.translatable) ||
    (definition?.blocks ?? []).some((block) => block.settings.some((item) => item.translatable))

  return (
    <aside className="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto border-s p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">{definition?.name ?? section.type}</h2>
        {hasTranslatable && (
          <Tabs value={localeTab} onValueChange={(value) => setLocaleTab(value as 'ar' | 'en')}>
            <TabsList>
              <TabsTrigger value="ar">AR</TabsTrigger>
              <TabsTrigger value="en">EN</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>

      {definitionList.length === 0 ? (
        <p className="text-sm text-muted-foreground">This section has no customizable settings.</p>
      ) : (
        <SettingsFields
          definitions={definitionList}
          form={form}
          locale={localeTab}
          fonts={schema.fonts ?? []}
          products={products}
          onCommit={commitField}
        />
      )}

      {definition && (definition.blocks?.length ?? 0) > 0 && (
        <BlocksEditor
          section={section}
          definition={definition}
          locale={localeTab}
          fonts={schema.fonts ?? []}
          products={products}
        />
      )}
    </aside>
  )
}
