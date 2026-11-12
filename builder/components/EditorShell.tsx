'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
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
      // Newly added sections only receive their ULID from the server. Sync the
      // returned draft so the next save updates them instead of recreating
      // them, while keeping the user's current selection.
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
      if (message.type === 'SECTION_CLICKED') selectSection(message.sectionId)
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
    <div className="flex min-h-[calc(100vh-5rem)] flex-col overflow-hidden rounded-xl border bg-background">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <PageSwitcher beforeSwitch={autoSave.flush} />
          <span className="text-xs text-muted-foreground">
            {autoSave.status === 'saving'
              ? 'Saving…'
              : autoSave.status === 'failed'
                ? 'Save failed'
                : dirty
                  ? 'Unsaved changes'
                  : autoSave.status === 'saved'
                    ? 'Saved'
                    : queryError
                      ? 'Offline draft'
                      : !pageFromServer
                        ? 'Sample layout (not saved)'
                        : 'Saved'}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <PublishControls flush={autoSave.flush} onPreviewToken={setPreviewToken} />
          <Button variant={locale === 'ar' ? 'secondary' : 'ghost'} size="sm" onClick={() => setLocale('ar')}>
            AR
          </Button>
          <Button variant={locale === 'en' ? 'secondary' : 'ghost'} size="sm" onClick={() => setLocale('en')}>
            EN
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Undo"
            onClick={() => useEditorStore.temporal.getState().undo()}
          >
            <Undo2 />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Redo"
            onClick={() => useEditorStore.temporal.getState().redo()}
          >
            <Redo2 />
          </Button>
          <Button
            size="sm"
            className="gap-2"
            disabled={!dirty || !pageFromServer || autoSave.status === 'saving'}
            onClick={() => void autoSave.flush()}
          >
            <Save className="size-4" />
            {autoSave.status === 'failed' ? 'Retry' : 'Save'}
          </Button>
        </div>
      </header>

      {loadFailure && (
        <div className="border-b bg-amber-50 px-4 py-2 text-xs text-amber-900">
          <p>
            Could not load the {loadFailure} from the server; your local editor remains active.
          </p>
          <p className="mt-1 font-mono text-[11px] break-all">{errorMessage(queryError)}</p>
        </div>
      )}

      {autoSave.status === 'failed' && autoSave.error != null && (
        <div className="border-b bg-red-50 px-4 py-2 text-xs text-red-900">
          <p>Saving the draft failed. Your changes are kept locally.</p>
          <p className="mt-1 font-mono text-[11px] break-all">{errorMessage(autoSave.error)}</p>
        </div>
      )}

      {settled && !pageFromServer && !loadFailure && (
        <div className="border-b bg-amber-50 px-4 py-2 text-xs text-amber-900">
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

      <div className="flex min-h-0 flex-1">
        <SectionsPanel />
        <main className="min-w-0 flex-1 overflow-auto p-4">
          <PreviewFrame
            page={page}
            schema={schema}
            locale={locale}
            selectedSectionId={selectedSectionId}
            previewToken={previewToken}
            onMessage={handlePreviewMessage}
          />
        </main>
        <SettingsPanel />
      </div>

      <footer className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
        <span>Theme editor</span>
        <span className="flex items-center gap-1">
          <ArrowLeft className="size-3" />
          Drag sections to reorder
          <ArrowRight className="size-3" />
        </span>
      </footer>
    </div>
  )
}
