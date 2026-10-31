'use client'

import { useState } from 'react'
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, type DragEndEvent, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Copy, Eye, EyeOff, GripVertical, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEditorStore } from '@/builder/store/editor-store'
import type { SectionInstance } from '@/shared/types/builder'

function SortableSection({ section, onSelect }: { section: SectionInstance; onSelect: () => void }) {
  const selected = useEditorStore((state) => state.selectedSectionId === section.id)
  const duplicate = useEditorStore((state) => state.duplicateSection)
  const remove = useEditorStore((state) => state.removeSection)
  const toggle = useEditorStore((state) => state.toggleSection)
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section.id })
  return <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`flex items-center gap-1 rounded-lg border p-2 ${selected ? 'border-primary bg-primary/5' : 'bg-card'}`}><button type="button" aria-label={`Move ${section.type}`} className="cursor-grab p-1 text-muted-foreground" {...attributes} {...listeners}><GripVertical className="size-4" /></button><button type="button" onClick={onSelect} className="min-w-0 flex-1 truncate text-start text-sm font-medium">{section.type}</button><Button type="button" variant="ghost" size="icon-xs" aria-label={section.hidden ? 'Show section' : 'Hide section'} onClick={() => toggle(section.id)}>{section.hidden ? <EyeOff /> : <Eye />}</Button><Button type="button" variant="ghost" size="icon-xs" aria-label="Duplicate section" onClick={() => duplicate(section.id)}><Copy /></Button><Button type="button" variant="ghost" size="icon-xs" aria-label="Delete section" onClick={() => remove(section.id)}><Trash2 /></Button></div>
}

export function SectionsPanel() {
  const sections = useEditorStore((state) => state.page.sections)
  const select = useEditorStore((state) => state.selectSection)
  const move = useEditorStore((state) => state.moveSection)
  const add = useEditorStore((state) => state.addSection)
  const [adding, setAdding] = useState(false)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))
  const handleDragEnd = ({ active, over }: DragEndEvent) => { if (over && active.id !== over.id) move(String(active.id), String(over.id)) }
  return <aside className="flex w-72 shrink-0 flex-col gap-3 border-e p-4"><div className="flex items-center justify-between"><h2 className="font-semibold">Sections</h2><Button variant="outline" size="icon-sm" aria-label="Add section" onClick={() => setAdding((value) => !value)}><Plus /></Button></div>{adding && <div className="grid gap-1 rounded-lg border bg-muted/30 p-2">{['hero', 'product_grid', 'faq', 'rich_text', 'image_text', 'header', 'footer'].map((type) => <Button key={type} variant="ghost" className="justify-start text-start" onClick={() => { add(type); setAdding(false) }}>{type}</Button>)}</div>}<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}><SortableContext items={sections.map((section) => section.id)} strategy={verticalListSortingStrategy}><div className="grid gap-2">{sections.map((section) => <SortableSection key={section.id} section={section} onSelect={() => select(section.id)} />)}</div></SortableContext></DndContext></aside>
}
