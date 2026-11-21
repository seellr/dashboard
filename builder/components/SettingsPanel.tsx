'use client'

import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, Layers } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BlocksEditor } from '@/builder/components/BlocksEditor'
import { SectionIcon } from '@/builder/lib/section-icons'
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

interface SettingsPanelProps {
  onBack?: () => void
}

export function SettingsPanel({ onBack }: SettingsPanelProps = {}) {
  const t = useTranslations('seller.builder')
  const section = useEditorStore((state) =>
    state.page.sections.find((item) => item.id === state.selectedSectionId),
  )
  const schema = useEditorStore((state) => state.schema)
  const localeTab = useEditorStore((state) => state.localeTab)
  const setLocaleTab = useEditorStore((state) => state.setLocaleTab)
  const selectSection = useEditorStore((state) => state.selectSection)
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
  const focusedField = useEditorStore((state) => state.focusedField)
  const focusTarget = useMemo(() => {
    if (!focusedField || focusedField.sectionId !== sectionId || focusedField.blockId) return null
    const target = definitionList.find((item) => item.key === focusedField.key)
    if (!target) return null
    return { name: settingFieldName(target, localeTab), token: focusedField.token }
  }, [focusedField, sectionId, definitionList, localeTab])

  useEffect(() => {
    if (!section) return
    form.reset(flattenSettings(section.settings, definitionList, localeTab))
    // Re-seed only when switching section or locale: resetting on every settings
    // change used to fight the user while typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionId, definitionList, localeTab, form])

  if (!section) {
    return (
      <div className="flex h-full min-h-[300px] flex-col items-center justify-center p-8 text-center gap-3">
        <div className="rounded-full bg-muted p-3">
          <Layers className="size-6 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">{t('noSectionSelected')}</p>
          <p className="text-xs text-muted-foreground max-w-xs">{t('selectSectionHint')}</p>
        </div>
        {onBack && (
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="mt-2 text-xs"
          >
            {t('backToSections')}
          </Button>
        )}
      </div>
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
    <div className="flex w-full flex-col gap-4 min-h-0">
      {/* Back Button & Section Header */}
      <div className="flex flex-col gap-2 border-b pb-3">
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              selectSection(null)
              onBack?.()
            }}
            className="gap-1 h-7 -ms-2 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-3.5 rtl:rotate-180" />
            <span>{t('backToSections')}</span>
          </Button>

          {hasTranslatable && (
            <Tabs value={localeTab} onValueChange={(value) => setLocaleTab(value as 'ar' | 'en')}>
              <TabsList className="h-7 p-0.5">
                <TabsTrigger value="ar" className="text-xs px-2 h-6">AR</TabsTrigger>
                <TabsTrigger value="en" className="text-xs px-2 h-6">EN</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
              <SectionIcon type={section.type} className="size-4" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold">
                {definition?.name ?? section.type}
              </h2>
              <p className="truncate text-[10px] text-muted-foreground">
                {definitionList.length} setting{definitionList.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-full border bg-muted/40 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
            {section.type}
          </span>
        </div>
      </div>

      {definitionList.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">
          This section has no customizable settings.
        </p>
      ) : (
        <SettingsFields
          definitions={definitionList}
          form={form}
          locale={localeTab}
          fonts={schema.fonts ?? []}
          products={products}
          onCommit={commitField}
          focusTarget={focusTarget}
        />
      )}

      {definition && (definition.blocks?.length ?? 0) > 0 && (
        <div className="border-t pt-4">
          <BlocksEditor
            section={section}
            definition={definition}
            locale={localeTab}
            fonts={schema.fonts ?? []}
            products={products}
          />
        </div>
      )}
    </div>
  )
}
