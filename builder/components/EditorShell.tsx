'use client'

import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Redo2, Save, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageSwitcher } from '@/builder/components/PageSwitcher'
import { PreviewFrame } from '@/builder/components/PreviewFrame'
import { SectionsPanel } from '@/builder/components/SectionsPanel'
import { SettingsPanel } from '@/builder/components/SettingsPanel'
import { useEditorStore } from '@/builder/store/editor-store'
import { useAutoSaveDraft } from '@/builder/hooks/useAutoSaveDraft'
import { useBeforeUnloadWarning } from '@/builder/hooks/useBeforeUnloadWarning'
import { useBuilderDraft, useBuilderPages, useBuilderSchema } from '@/builder/hooks/useBuilderData'
import { subscriberThemeApi } from '@/api/client'
import { PublishControls } from '@/builder/components/PublishControls'
import type { PreviewToEditorMessage } from '@/shared/types/preview-protocol'

export function EditorShell() {
  const page = useEditorStore((state) => state.page)
  const schema = useEditorStore((state) => state.schema)
  const locale = useEditorStore((state) => state.locale)
  const selectedSectionId = useEditorStore((state) => state.selectedSectionId)
  const dirty = useEditorStore((state) => state.dirty)
  const setLocale = useEditorStore((state) => state.setLocale)
  const selectSection = useEditorStore((state) => state.selectSection)
  const save = useEditorStore((state) => state.resetDirty)
  const hydrate = useEditorStore((state) => state.hydrate)
  const schemaQuery = useBuilderSchema(locale)
  const pagesQuery = useBuilderPages(locale)
  const firstPageId = pagesQuery.data?.[0]?.ulid
  const draftQuery = useBuilderDraft(locale, firstPageId)
  useEffect(() => { if (schemaQuery.data && draftQuery.data) hydrate(draftQuery.data, schemaQuery.data) }, [draftQuery.data, hydrate, schemaQuery.data])
  const saveDraft = useCallback(async (latestPage: typeof page) => { await subscriberThemeApi.saveDraft(locale, latestPage.ulid, latestPage); save() }, [locale, save])
  const autoSave = useAutoSaveDraft({ page, dirty, save: saveDraft })
  useBeforeUnloadWarning(dirty)
  const [previewToken, setPreviewToken] = useState<string | null>(null)
  const handlePreviewMessage = useCallback((message: PreviewToEditorMessage) => { if (message.type === 'SECTION_CLICKED') selectSection(message.sectionId) }, [selectSection])
  const queryError = schemaQuery.error || pagesQuery.error || draftQuery.error
  return <div className="flex min-h-[calc(100vh-5rem)] flex-col overflow-hidden rounded-xl border bg-background"><header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3"><div className="flex items-center gap-3"><PageSwitcher /><span className="text-xs text-muted-foreground">{autoSave.status === 'saving' ? 'Saving…' : autoSave.status === 'failed' ? 'Save failed' : dirty ? 'Unsaved changes' : autoSave.status === 'saved' ? 'Saved' : queryError ? 'Offline draft' : 'Saved'}</span></div><div className="flex flex-wrap items-center gap-1"><PublishControls flush={autoSave.flush} onPreviewToken={setPreviewToken} /><Button variant={locale === 'ar' ? 'secondary' : 'ghost'} size="sm" onClick={() => setLocale('ar')}>AR</Button><Button variant={locale === 'en' ? 'secondary' : 'ghost'} size="sm" onClick={() => setLocale('en')}>EN</Button><Button variant="ghost" size="icon-sm" aria-label="Undo" onClick={() => useEditorStore.temporal.getState().undo()}><Undo2 /></Button><Button variant="ghost" size="icon-sm" aria-label="Redo" onClick={() => useEditorStore.temporal.getState().redo()}><Redo2 /></Button><Button size="sm" className="gap-2" disabled={!dirty || autoSave.status === 'saving'} onClick={() => void autoSave.flush()}><Save className="size-4" />{autoSave.status === 'failed' ? 'Retry' : 'Save'}</Button></div></header>{queryError && <div className="border-b bg-amber-50 px-4 py-2 text-xs text-amber-900">Server data is unavailable; your local editor remains active.</div>}<div className="flex min-h-0 flex-1"><SectionsPanel /><main className="min-w-0 flex-1 overflow-auto p-4"><PreviewFrame page={page} schema={schema} locale={locale} selectedSectionId={selectedSectionId} previewToken={previewToken} onMessage={handlePreviewMessage} /></main><SettingsPanel /></div><footer className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground"><span>Theme editor</span><span className="flex items-center gap-1"><ArrowLeft className="size-3" />Drag sections to reorder<ArrowRight className="size-3" /></span></footer></div>
}
