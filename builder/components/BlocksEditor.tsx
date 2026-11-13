'use client'

import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SettingsFields, type SettingsFormValues } from '@/builder/components/SettingsFields'
import { commitSetting, flattenSettings, settingFieldName } from '@/builder/lib/settings-form'
import { useEditorStore } from '@/builder/store/editor-store'
import type { BlockDefinition, BlockInstance, Locale, SectionDefinition, SectionInstance } from '@/shared/types/builder'
import type { SellerProduct } from '@/lib/seller/resource-client'

interface BlocksEditorProps {
  section: SectionInstance
  definition: SectionDefinition
  locale: Locale
  fonts: string[]
  products: SellerProduct[]
}

/**
 * Sections such as FAQ, testimonials, hero buttons or header links keep their
 * repeatable content in `blocks`. Without this editor those sections could
 * only show their (empty) defaults — there was no way to add the questions,
 * quotes or buttons that actually get saved.
 */
export function BlocksEditor({ section, definition, locale, fonts, products }: BlocksEditorProps) {
  const addBlock = useEditorStore((state) => state.addBlock)
  const blocks = useMemo(() => section.blocks ?? [], [section.blocks])
  const blockDefinitions = definition.blocks ?? []
  const maxBlocks = definition.max_blocks ?? null

  const countByType = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const block of blocks) counts[block.type] = (counts[block.type] ?? 0) + 1
    return counts
  }, [blocks])

  const atGlobalLimit = maxBlocks != null && blocks.length >= maxBlocks

  return (
    <div className="grid gap-3 border-t pt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{blockDefinitions.length === 1 ? `${blockDefinitions[0].name}s` : 'Blocks'}</h3>
        <span className="text-xs text-muted-foreground">{blocks.length}{maxBlocks != null ? ` / ${maxBlocks}` : ''}</span>
      </div>

      {blocks.length === 0 ? (
        <p className="text-xs text-muted-foreground">No blocks yet. Add one below to fill this section.</p>
      ) : (
        <div className="grid gap-3">
          {blocks.map((block) => (
            <BlockCard
              key={block.id}
              sectionId={section.id}
              block={block}
              definition={definition.blocks?.find((item) => item.handle === block.type)}
              locale={locale}
              fonts={fonts}
              products={products}
            />
          ))}
        </div>
      )}

      {blockDefinitions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {blockDefinitions.map((blockDefinition) => {
            const limit = blockDefinition.limit ?? null
            const count = countByType[blockDefinition.handle] ?? 0
            const disabled = atGlobalLimit || (limit != null && count >= limit)
            return (
              <Button
                key={blockDefinition.handle}
                type="button"
                size="sm"
                variant="outline"
                className="gap-1.5"
                disabled={disabled}
                onClick={() => addBlock(section.id, blockDefinition, locale)}
              >
                <Plus className="size-4" />
                Add {blockDefinition.name.toLowerCase()}
              </Button>
            )
          })}
        </div>
      )}
    </div>
  )
}

interface BlockCardProps {
  sectionId: string
  block: BlockInstance
  definition: BlockDefinition | undefined
  locale: Locale
  fonts: string[]
  products: SellerProduct[]
}

function BlockCard({ sectionId, block, definition, locale, fonts, products }: BlockCardProps) {
  const updateBlockSettings = useEditorStore((state) => state.updateBlockSettings)
  const removeBlock = useEditorStore((state) => state.removeBlock)
  const definitions = useMemo(() => definition?.settings ?? [], [definition])
  const form = useForm<SettingsFormValues>({
    defaultValues: flattenSettings(block.settings, definitions, locale),
  })

  useEffect(() => {
    form.reset(flattenSettings(block.settings, definitions, locale))
    // Re-seed only when switching block or locale. Resetting on every settings
    // change would fight the user while they type.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block.id, definitions, locale, form])

  const commitField = (fieldName: string, value: unknown) => {
    const target = definitions.find((item) => settingFieldName(item, locale) === fieldName)
    if (!target) return
    const latest = useEditorStore
      .getState()
      .page.sections.find((item) => item.id === sectionId)
      ?.blocks?.find((item) => item.id === block.id)
    updateBlockSettings(sectionId, block.id, commitSetting(latest?.settings ?? block.settings, target, value, locale))
  }

  return (
    <div className="grid gap-3 rounded-lg border bg-muted/20 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {definition?.name ?? block.type}
        </span>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label="Remove block"
          onClick={() => removeBlock(sectionId, block.id)}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
      {definitions.length === 0 ? (
        <p className="text-xs text-muted-foreground">This block has no editable settings.</p>
      ) : (
        <SettingsFields
          definitions={definitions}
          form={form}
          locale={locale}
          fonts={fonts}
          products={products}
          onCommit={commitField}
        />
      )}
    </div>
  )
}
