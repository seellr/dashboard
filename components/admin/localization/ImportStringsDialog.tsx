'use client'

import { useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { sileo } from 'sileo'
import { FileUp, Loader2 } from 'lucide-react'
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useImportUiStrings } from '@/hooks/queries/useUiStrings'
import type { UiStringLocale, UiStringMap, UiStringScope } from '@/lib/admin/ui-strings'

interface Props {
  scope: UiStringScope
  id: number
  locale: UiStringLocale
  errorMessage: (errorCode: string, fallback: string) => string
}

export function ImportStringsDialog({ scope, id, locale, errorMessage }: Props) {
  const t = useTranslations('admin.localization')
  const fileRef = useRef<HTMLInputElement>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pendingMap, setPendingMap] = useState<UiStringMap | null>(null)

  const importStrings = useImportUiStrings(scope, id, locale)

  function resetFileInput() {
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? '')
      let parsed: unknown
      try {
        parsed = JSON.parse(text)
      } catch {
        sileo.error({ title: t('import.invalidJson') })
        resetFileInput()
        return
      }

      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        sileo.error({ title: t('import.invalidFormat') })
        resetFileInput()
        return
      }

      const map: UiStringMap = {}
      for (const [key, value] of Object.entries(parsed)) {
        if (typeof value !== 'string') {
          sileo.error({ title: t('import.invalidFormat') })
          resetFileInput()
          return
        }
        map[key] = value
      }

      if (Object.keys(map).length === 0) {
        sileo.error({ title: t('import.emptyFile') })
        resetFileInput()
        return
      }

      setPendingMap(map)
      setDialogOpen(true)
      resetFileInput()
    }
    reader.readAsText(file)
  }

  const canConfirm = pendingMap !== null && Object.keys(pendingMap).length > 0

  async function handleConfirm() {
    if (!pendingMap) return
    const result = await importStrings.mutateAsync(pendingMap)
    if (!result.ok) {
      sileo.error({ title: errorMessage(result.errorCode, result.message) })
      return
    }
    sileo.success({ title: t('import.success') })
    setDialogOpen(false)
    setPendingMap(null)
  }

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
        <FileUp className="h-4 w-4" />
        {t('import.button')}
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('import.title')}</DialogTitle>
            <DialogDescription>{t('import.confirmBody')}</DialogDescription>
          </DialogHeader>
          {pendingMap && (
            <p className="text-sm text-muted-foreground">
              {t('import.confirmCount', { count: Object.keys(pendingMap).length })}
            </p>
          )}
          <DialogFooter>
            <DialogClose render={<Button variant="outline">{t('import.cancel')}</Button>} />
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={!canConfirm || importStrings.isPending}
            >
              {importStrings.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('import.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}