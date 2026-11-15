'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft,
  FileText,
  Layers,
  Redo2,
  Save,
  SlidersHorizontal,
  Undo2,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { PageSwitcher } from '@/builder/components/PageSwitcher'
import { PreviewFrame } from '@/builder/components/PreviewFrame'
import { SectionsPanel } from '@/builder/components/SectionsPanel'
import { SettingsPanel } from '@/builder/components/SettingsPanel'
import { useEditorStore } from '@/builder/store/editor-store'
import { useAutoSaveDraft } from '@/builder/hooks/useAutoSaveDraft'
import { useBeforeUnloadWarning } from '@/builder/hooks/useBeforeUnloadWarning'
import {
  useBuilderDraft,
  useBuilderPages,
  useBuilderSchema,
} from '@/builder/hooks/useBuilderData'
import { BuilderApiError, subscriberThemeApi } from '@/api/client'
import { builderPageSchema } from '@/shared/schemas/builder'
import { PublishControls } from '@/builder/components/PublishControls'
import type { PreviewToEditorMessage } from '@/shared/types/preview-protocol'
import type { BuilderPage } from '@/shared/types/builder'

function describeFields(fields?: Record<string, string[]>): string {
  if (!fields) return ''
  return Object.entries(fields)
    .map(([field, messages]) => `${field}: ${messages.join('; ')}`)
    .join(' | ')
}

function errorMessage(error: unknown): string {
  if (error instanceof BuilderApiError) {
    const code = error.code ? ` (${error.code})` : ''
    const fields = describeFields(error.fields)
    return `HTTP ${error.status}${code}: ${error.message}${fields ? ` — ${fields}` : ''}`
  }
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'string' && error) return error
  return 'Unknown error'
}

export function EditorShell() {
  const t = useTranslations('seller.builder')
  const page = useEditorStore((state) => state.page)
  const schema = useEditorStore((state) => state.schema)
  const locale = useEditorStore((state) => state.locale)
  const selectedSectionId = useEditorStore((state) => state.selectedSectionId)
  const dirty = useEditorStore((state) => state.dirty)
  const pageFromServer = useEditorStore((state) => state.pageFromServer)
  const setLocale = useEditorStore((state) => state.setLocale)
  const selectSection = useEditorStore((state) => state.selectSection)
  const save = useEditorStore((state) => state.resetDirty)
  const hydrate = useEditorStore((state) => state.hydrate)
  const setSchema = useEditorStore((state) => state.setSchema)
  const schemaQuery = useBuilderSchema(locale)
  const pagesQuery = useBuilderPages(locale)

  const [activeTab, setActiveTab] = useState<'sections' | 'settings'>('sections')

  // Automatically switch left panel tab to 'settings' when a section is selected
  useEffect(() => {
    if (selectedSectionId) {
      setActiveTab('settings')
    }
  }, [selectedSectionId])

  const selectedSection = useMemo(
    () => page.sections.find((item) => item.id === selectedSectionId),
    [page.sections, selectedSectionId],
  )

  /**
   * The editor keeps the page being edited in `?page=<ulid>` so a reload lands
   * on the same page. Without it the editor always returned to `home`, which
   * looked exactly like "my saved sections disappeared" after every refresh.
   */
  const searchParams = useSearchParams()
  const requestedPageUlid = searchParams?.get('page') ?? null

  const resolvedPage = useMemo(() => {
    const pages = pagesQuery.data ?? []
    const requested = requestedPageUlid
      ? pages.find((item) => item.ulid === requestedPageUlid)
      : undefined
    // The live list is ordered by creation and starts with `thank_you`; `home`
    // is the page users expect to land on.
    return requested ?? pages.find((item) => item.type === 'home') ?? pages[0]
  }, [pagesQuery.data, requestedPageUlid])

  const pageUlid = resolvedPage?.ulid
  const draftQuery = useBuilderDraft(locale, pageUlid)
  const initialized = useRef(false)

  useEffect(() => {
    if (schemaQuery.data) setSchema(schemaQuery.data)
  }, [schemaQuery.data, setSchema])

  /**
   * `GET /pages/{ulid}/draft` may 404 until the page has been saved once. The
   * page list still provides a real ULID, so fall back to it (with whatever
   * sections it has) instead of leaving the editor on the unsaveable sample.
   */
  const fallbackPage = draftQuery.error ? resolvedPage : undefined

  useEffect(() => {
    if (initialized.current) return
    const source = draftQuery.data ?? fallbackPage
    if (schemaQuery.data && source) {
      initialized.current = true
      hydrate(source, schemaQuery.data)
    }
  }, [draftQuery.data, fallbackPage, hydrate, schemaQuery.data])

  const queryClient = useQueryClient()
  const saveDraft = useCallback(
    async (latestPage: typeof page) => {
      const response = await subscriberThemeApi.saveDraft(locale, latestPage.ulid, latestPage)
      const parsed = builderPageSchema.safeParse(response.data)
      // Server-assigned ULIDs are needed for newly added sections *and* newly
      // added blocks. Syncing only on new sections meant a new FAQ/testimonial
      // block stayed client-only, so the next save recreated it.
      const needsServerIds =
        latestPage.sections.some((section) => !section.ulid) ||
        latestPage.sections.some((section) =>
          (section.blocks ?? []).some((block) => !block.ulid),
        )
      if (parsed.success && needsServerIds) {
        useEditorStore.getState().syncSections((parsed.data as BuilderPage).sections)
      } else {
        save()
      }
      // Keep the cached draft (used when the editor remounts or another page is
      // switched back to) in sync with what the server just stored.
      void queryClient.invalidateQueries({ queryKey: ['builder-draft', locale, latestPage.ulid] })
    },
    [locale, queryClient, save],
  )

  const autoSave = useAutoSaveDraft({ page, dirty, save: saveDraft, enabled: pageFromServer })
  useBeforeUnloadWarning(dirty)
  const [previewToken, setPreviewToken] = useState<string | null>(null)

  const handlePreviewMessage = useCallback(
    (message: PreviewToEditorMessage) => {
      if (message.type === 'SECTION_CLICKED') {
        selectSection(message.sectionId)
        setActiveTab('settings')
      }
    },
    [selectSection],
  )

  const queryError = schemaQuery.error || pagesQuery.error || draftQuery.error
  const loadFailure = schemaQuery.error
    ? 'theme schema'
    : pagesQuery.error
      ? 'pages list'
      : draftQuery.error
        ? 'page draft'
        : null
  const settled = !schemaQuery.isLoading && !pagesQuery.isLoading && !draftQuery.isLoading

  // An empty pages list is not a request error, so distinguish it from a
  // payload/HTTP failure: the fixes are different (seed pages vs. fix parsing).
  const pagesEmpty = settled && !pagesQuery.error && (pagesQuery.data?.length ?? 0) === 0

  return (
    <div className="flex h-[calc(100vh-6.5rem)] flex-col overflow-hidden rounded-xl border bg-background shadow-xs">
      {/* Top Header Bar */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2.5 bg-card/80 backdrop-blur-xs">
        {/* Left: Exit Link + Live Save Status */}
        <div className="flex items-center gap-4">
          <Link
            href={`/${locale}/seller/theme`}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="size-4 rtl:rotate-180" />
            <span>{t('backToThemes')}</span>
          </Link>

          <div className="h-4 w-px bg-border" />

          {/* Status Dot & Message */}
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`inline-flex size-2 rounded-full ${
                autoSave.status === 'saving'
                  ? 'bg-blue-500 animate-pulse'
                  : autoSave.status === 'failed'
                    ? 'bg-destructive'
                    : dirty
                      ? 'bg-amber-500 animate-pulse'
                      : 'bg-emerald-500'
              }`}
            />
            <span className="text-muted-foreground text-[11px] font-medium">
              {autoSave.status === 'saving'
                ? t('saving')
                : autoSave.status === 'failed'
                  ? t('saveFailed')
                  : dirty
                    ? t('unsavedChanges')
                    : autoSave.status === 'saved'
                      ? t('saved')
                      : queryError
                        ? t('offlineDraft')
                        : !pageFromServer
                          ? t('sampleLayout')
                          : t('saved')}
            </span>
          </div>
        </div>

        {/* Right: Publish Controls + AR/EN + Undo/Redo + Save */}
        <div className="flex flex-wrap items-center gap-1.5">
          <PublishControls flush={autoSave.flush} onPreviewToken={setPreviewToken} />

          <div className="flex items-center rounded-lg border bg-muted/40 p-0.5">
            <Button
              variant={locale === 'ar' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setLocale('ar')}
            >
              AR
            </Button>
            <Button
              variant={locale === 'en' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setLocale('en')}
            >
              EN
            </Button>
          </div>

          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Undo"
              onClick={() => useEditorStore.temporal.getState().undo()}
              title="Undo"
            >
              <Undo2 className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Redo"
              onClick={() => useEditorStore.temporal.getState().redo()}
              title="Redo"
            >
              <Redo2 className="size-3.5" />
            </Button>
          </div>

          <Button
            size="sm"
            className="h-8 gap-1.5 px-3 text-xs"
            disabled={!dirty || !pageFromServer || autoSave.status === 'saving'}
            onClick={() => void autoSave.flush()}
          >
            <Save className="size-3.5" />
            <span>{autoSave.status === 'failed' ? 'Retry' : 'Save'}</span>
          </Button>
        </div>
      </header>

      {/* Warning/Error Banners */}
      {loadFailure && (
        <div className="border-b bg-amber-50 px-4 py-2 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          <p>
            Could not load the {loadFailure} from the server; your local editor remains active.
          </p>
          <p className="mt-1 font-mono text-[11px] break-all">{errorMessage(queryError)}</p>
        </div>
      )}

      {autoSave.status === 'failed' && autoSave.error != null && (
        <div className="border-b bg-red-50 px-4 py-2 text-xs text-red-900 dark:bg-red-950/40 dark:text-red-200">
          <p>Saving the draft failed. Your changes are kept locally.</p>
          <p className="mt-1 font-mono text-[11px] break-all">{errorMessage(autoSave.error)}</p>
        </div>
      )}

      {settled && !pageFromServer && !loadFailure && (
        <div className="border-b bg-amber-50 px-4 py-2 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          {pagesEmpty ? (
            <>
              The active theme has no pages yet, so this is a sample layout and saving is disabled.
              Create a page (or seed the theme) before editing.
            </>
          ) : (
            <>
              No page was loaded from the server, so saving is disabled. Check that{' '}
              <code>GET /subscriber/pages</code> returns at least one page for the active theme.
            </>
          )}
        </div>
      )}

      {/* Main Workspace: Left Panel (Controls) + Right Side (Live Page Preview) */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* LEFT PANEL: Page Selector, Sections & Settings */}
        <aside className="w-[360px] lg:w-[400px] shrink-0 border-e bg-card/60 backdrop-blur-xs flex flex-col min-h-0 overflow-hidden">
          {/* 1. Page Switcher Header */}
          <div className="border-b p-3 bg-muted/20">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="size-3.5" />
                <span>{t('page')}</span>
              </span>
              <span className="text-[10px] rounded-full border bg-background px-2 py-0.5 text-muted-foreground font-mono">
                {page.type}
              </span>
            </div>
            <PageSwitcher beforeSwitch={autoSave.flush} />
          </div>

          {/* 2. Mode Segmented Navigation: Sections vs Settings */}
          <div className="border-b p-2 bg-muted/10">
            <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-0.5 w-full">
              <button
                type="button"
                onClick={() => setActiveTab('sections')}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-all ${
                  activeTab === 'sections'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Layers className="size-3.5" />
                <span>{t('sections')}</span>
                <span className="rounded-full bg-muted px-1.5 py-0.2 text-[10px] text-muted-foreground">
                  {page.sections.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-all ${
                  activeTab === 'settings'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <SlidersHorizontal className="size-3.5" />
                <span>{t('settings')}</span>
                {selectedSection && (
                  <span className="max-w-[70px] truncate rounded bg-primary/10 text-primary px-1 text-[10px]">
                    {selectedSection.type}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* 3. Panel Body: Sections List or Settings Form */}
          <div className="flex-1 overflow-y-auto min-h-0 p-3">
            {activeTab === 'sections' ? (
              <SectionsPanel />
            ) : (
              <SettingsPanel onBack={() => setActiveTab('sections')} />
            )}
          </div>
        </aside>

        {/* RIGHT SIDE: Live Page Preview */}
        <main className="flex-1 min-w-0 flex flex-col min-h-0 bg-muted/20 overflow-hidden">
          <PreviewFrame
            page={page}
            schema={schema}
            locale={locale}
            selectedSectionId={selectedSectionId}
            previewToken={previewToken}
            onMessage={handlePreviewMessage}
          />
        </main>
      </div>
    </div>
  )
}
