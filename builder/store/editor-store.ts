'use client'

import { create } from 'zustand'
import { temporal } from 'zundo'
import type { BuilderPage, Locale, SectionInstance, ThemeSchema } from '@/shared/types/builder'
import { samplePage, sampleSchema } from '@/api/mocks/data'

interface EditorState {
  page: BuilderPage
  schema: ThemeSchema
  locale: Locale
  localeTab: Locale
  selectedSectionId: string | null
  selectedBlockId: string | null
  dirty: boolean
  setLocale: (locale: Locale) => void
  setLocaleTab: (locale: Locale) => void
  selectSection: (sectionId: string | null) => void
  selectBlock: (blockId: string | null) => void
  setPage: (page: BuilderPage) => void
  hydrate: (page: BuilderPage, schema: ThemeSchema) => void
  updateSectionSettings: (sectionId: string, settings: SectionInstance['settings']) => void
  moveSection: (activeId: string, overId: string) => void
  moveBlock: (sectionId: string, activeId: string, overId: string) => void
  addSection: (type: string) => void
  duplicateSection: (sectionId: string) => void
  removeSection: (sectionId: string) => void
  toggleSection: (sectionId: string) => void
  resetDirty: () => void
}

function clonePage(page: BuilderPage): BuilderPage {
  return { ...page, sections: page.sections.map((section) => ({ ...section, settings: { ...section.settings }, blocks: section.blocks?.map((block) => ({ ...block, settings: { ...block.settings } })) })) }
}

export const useEditorStore = create<EditorState>()(temporal((set) => ({
  page: clonePage(samplePage), schema: sampleSchema, locale: 'en', localeTab: 'en', selectedSectionId: samplePage.sections[0]?.id ?? null, selectedBlockId: null, dirty: false,
  setLocale: (locale) => set({ locale }), setLocaleTab: (localeTab) => set({ localeTab }),
  selectSection: (selectedSectionId) => set({ selectedSectionId, selectedBlockId: null }),
  selectBlock: (selectedBlockId) => set({ selectedBlockId }),
  setPage: (page) => set({ page: clonePage(page), dirty: false, selectedSectionId: page.sections[0]?.id ?? null }),
  hydrate: (page, schema) => set((state) => state.dirty ? state : { page: clonePage(page), schema, selectedSectionId: page.sections[0]?.id ?? null }),
  updateSectionSettings: (sectionId, settings) => set((state) => ({ page: { ...state.page, sections: state.page.sections.map((section) => section.id === sectionId ? { ...section, settings } : section) }, dirty: true })),
  moveSection: (activeId, overId) => set((state) => { const from = state.page.sections.findIndex((section) => section.id === activeId); const to = state.page.sections.findIndex((section) => section.id === overId); if (from < 0 || to < 0 || from === to) return state; const sections = [...state.page.sections]; const [item] = sections.splice(from, 1); sections.splice(to, 0, item); return { page: { ...state.page, sections }, dirty: true } }),
  moveBlock: (sectionId, activeId, overId) => set((state) => ({ page: { ...state.page, sections: state.page.sections.map((section) => { if (section.id !== sectionId || !section.blocks) return section; const from = section.blocks.findIndex((block) => block.id === activeId); const to = section.blocks.findIndex((block) => block.id === overId); if (from < 0 || to < 0 || from === to) return section; const blocks = [...section.blocks]; const [item] = blocks.splice(from, 1); blocks.splice(to, 0, item); return { ...section, blocks } }) }, dirty: true })),
  addSection: (type) => set((state) => { const id = `section-${Date.now()}`; return { page: { ...state.page, sections: [...state.page.sections, { id, type, settings: {} }] }, selectedSectionId: id, dirty: true } }),
  duplicateSection: (sectionId) => set((state) => { const index = state.page.sections.findIndex((section) => section.id === sectionId); if (index < 0) return state; const source = state.page.sections[index]; const duplicate = { ...source, id: `section-${Date.now()}`, settings: { ...source.settings }, blocks: source.blocks?.map((block) => ({ ...block, id: `block-${Date.now()}-${block.id}`, settings: { ...block.settings } })) }; const sections = [...state.page.sections]; sections.splice(index + 1, 0, duplicate); return { page: { ...state.page, sections }, selectedSectionId: duplicate.id, dirty: true } }),
  removeSection: (sectionId) => set((state) => { const sections = state.page.sections.filter((section) => section.id !== sectionId); return { page: { ...state.page, sections }, selectedSectionId: sections[0]?.id ?? null, dirty: true } }),
  toggleSection: (sectionId) => set((state) => ({ page: { ...state.page, sections: state.page.sections.map((section) => section.id === sectionId ? { ...section, hidden: !section.hidden } : section) }, dirty: true })),
  resetDirty: () => set({ dirty: false }),
})))
