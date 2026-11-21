'use client'

import { useMemo, useState } from 'react'
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  type DragEndEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  Layers,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SectionIcon } from '@/builder/lib/section-icons'
import { useEditorStore } from '@/builder/store/editor-store'
import type { SectionInstance } from '@/shared/types/builder'
import { storefrontSectionCatalog } from '@/renderer/section-catalog'

function SortableSection({
  section,
  name,
  onSelect,
}: {
  section: SectionInstance
  name: string
  onSelect: () => void
}) {
  const selected = useEditorStore((state) => state.selectedSectionId === section.id)
  const duplicate = useEditorStore((state) => state.duplicateSection)
  const remove = useEditorStore((state) => state.removeSection)
  const toggle = useEditorStore((state) => state.toggleSection)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : section.hidden ? 0.6 : 1,
      }}
      className={`group relative flex items-center gap-1.5 rounded-xl border p-2 transition-all ${
        selected
          ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
          : 'bg-card shadow-xs hover:border-primary/30 hover:bg-muted/30 hover:shadow-sm'
      }`}
    >
      <button
        type="button"
        aria-label={`Move ${name}`}
        className="shrink-0 cursor-grab p-0.5 text-muted-foreground/50 transition-colors hover:text-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>

      <div
        className={`grid size-8 shrink-0 place-items-center rounded-lg border transition-colors ${
          selected ? 'border-primary/30 bg-primary/10 text-primary' : 'bg-muted/50 text-muted-foreground'
        }`}
      >
        <SectionIcon type={section.type} className="size-4" />
      </div>

      <button
        type="button"
        onClick={onSelect}
        className="min-w-0 flex-1 text-start"
      >
        <span
          className={`block truncate text-sm font-medium ${
            section.hidden ? 'text-muted-foreground line-through' : ''
          }`}
        >
          {name}
        </span>
        <span className="mt-0.5 block truncate font-mono text-[10px] text-muted-foreground/70">
          {section.hidden ? 'Hidden · ' : ''}
          {section.type}
        </span>
      </button>

      <div className="flex shrink-0 items-center gap-0.5 opacity-70 transition-opacity group-hover:opacity-100">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="text-muted-foreground hover:text-foreground"
          aria-label={section.hidden ? 'Show section' : 'Hide section'}
          onClick={() => toggle(section.id)}
        >
          {section.hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="text-muted-foreground hover:text-foreground"
          aria-label="Duplicate section"
          onClick={() => duplicate(section.id)}
        >
          <Copy className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="text-muted-foreground hover:text-destructive"
          aria-label="Delete section"
          onClick={() => remove(section.id)}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}

export function SectionsPanel() {
  const t = useTranslations('seller.builder')
  const sections = useEditorStore((state) => state.page.sections)
  const page = useEditorStore((state) => state.page)
  const schema = useEditorStore((state) => state.schema)
  const select = useEditorStore((state) => state.selectSection)
  const move = useEditorStore((state) => state.moveSection)
  const add = useEditorStore((state) => state.addSection)
  const locale = useEditorStore((state) => state.locale)

  const [adding, setAdding] = useState(false)
  const [search, setSearch] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) {
      move(String(active.id), String(over.id))
    }
  }

  const definitions = useMemo(() => {
    const fromSchema = schema.sections.filter(
      (definition) => !definition.page_types?.length || definition.page_types.includes(page.type),
    )
    if (fromSchema.length > 0) return fromSchema

    return storefrontSectionCatalog.map((item) => ({
      handle: item.type,
      name: item.label[locale],
      description: item.description[locale],
      page_types: [] as string[],
      settings: [],
      blocks: [],
    }))
  }, [schema.sections, page.type, locale])

  const filteredDefinitions = useMemo(() => {
    if (!search.trim()) return definitions
    const q = search.toLowerCase()
    return definitions.filter((def) => {
      const matchName = def.name.toLowerCase().includes(q)
      const matchHandle = def.handle.toLowerCase().includes(q)
      const catalogItem = storefrontSectionCatalog.find((item) => item.type === def.handle)
      const matchDesc = catalogItem
        ? catalogItem.description[locale].toLowerCase().includes(q)
        : false
      return matchName || matchHandle || matchDesc
    })
  }, [definitions, search, locale])

  const nameFor = (type: string) =>
    schema.sections.find((definition) => definition.handle === type)?.name ??
    storefrontSectionCatalog.find((item) => item.type === type)?.label[locale] ??
    type

  return (
    <div className="flex w-full flex-col gap-3 min-h-0">
      {/* Header with Add Section Button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Layers className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">{t('sections')}</h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground font-medium">
            {sections.length}
          </span>
        </div>
        <Button
          variant={adding ? 'secondary' : 'default'}
          size="sm"
          className="gap-1.5 h-8 px-2.5 text-xs"
          onClick={() => {
            setAdding((val) => !val)
            setSearch('')
          }}
        >
          {adding ? <X className="size-3.5" /> : <Plus className="size-3.5" />}
          <span>{t('addSection')}</span>
        </Button>
      </div>

      {/* Add Section Picker Drawer / Panel */}
      {adding && (
        <div className="flex flex-col gap-2 rounded-xl border bg-card p-3 shadow-sm animate-in fade-in-0 zoom-in-95 duration-100">
          <div className="relative">
            <Search className="absolute start-2.5 top-2.5 size-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchSections')}
              className="h-8 ps-8 text-xs"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute end-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <div className="grid max-h-60 gap-1 overflow-y-auto pe-1">
            {filteredDefinitions.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">
                {t('noSectionsFound')}
              </p>
            ) : (
              filteredDefinitions.map((definition) => {
                const catalogItem = storefrontSectionCatalog.find(
                  (item) => item.type === definition.handle,
                )
                const desc = catalogItem?.description[locale]
                return (
                  <button
                    key={definition.handle}
                    type="button"
                    onClick={() => {
                      add(definition.handle)
                      setAdding(false)
                      setSearch('')
                    }}
                    className="group flex items-center gap-2.5 rounded-lg border border-transparent p-2 text-start transition-all hover:border-primary/30 hover:bg-background hover:shadow-xs"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted/60 text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                      <SectionIcon type={definition.handle} className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-medium text-foreground">
                        {definition.name}
                      </span>
                      {desc && (
                        <span className="mt-0.5 block text-[11px] text-muted-foreground line-clamp-1">
                          {desc}
                        </span>
                      )}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Sortable List of Sections */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sections.map((section) => section.id)} strategy={verticalListSortingStrategy}>
          <div className="grid gap-2">
            {sections.map((section) => (
              <SortableSection
                key={section.id}
                section={section}
                name={nameFor(section.type)}
                onSelect={() => select(section.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Helpful Hint Footer */}
      {sections.length > 1 && (
        <p className="pt-2 text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1">
          <GripVertical className="size-3" />
          <span>{t('dragToReorder')}</span>
        </p>
      )}
    </div>
  )
}
