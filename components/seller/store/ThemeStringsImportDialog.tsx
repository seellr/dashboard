'use client'

import { useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { FileJson, Loader2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { THEME_STRING_LOCALES, type ThemeStringLocale } from '@/lib/seller/theme-strings'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  locale: ThemeStringLocale
  onImport: (strings: Record<string, string>) => Promise<boolean>
}

/**
 * `POST /subscriber/theme/locale/{locale}/import` bulk-replaces every override
 * for the locale, so the dialog validates the whole object first, refuses an
 * empty payload (which would wipe the locale) and warns about the replacement.
 */
export function ThemeStringsImportDialog({
  open,
  onOpenChange,
  locale,
  onImport,
}: Props) {
  const t = useTranslations('seller.theme.strings')
  const localeLabel =
    THEME_STRING_LOCALES.find((item) => item.value === locale)?.label ?? locale
  const [json, setJson] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setJson('')
    setError('')
    setSaving(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const changeOpen = (next: boolean) => {
    if (saving) return
    if (!next) reset()
    onOpenChange(next)
  }

  const submit = async () => {
    let parsed: unknown
    try {
      parsed = JSON.parse(json) as unknown
    } catch {
      setError(t('invalidJson'))
      return
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      setError(t('invalidJson'))
      return
    }

    const strings: Record<string, string> = {}
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value !== 'string') {
        setError(t('importInvalidValues'))
        return
      }
      const trimmed = key.trim()
      if (!trimmed) {
        setError(t('importInvalidValues'))
        return
      }
      strings[trimmed] = value
    }

    if (Object.keys(strings).length === 0) {
      setError(t('invalidJson'))
      return
    }

    setError('')
    setSaving(true)
    const ok = await onImport(strings)
    setSaving(false)
    if (ok) {
      reset()
      onOpenChange(false)
    }
  }

  const readFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setJson(String(reader.result ?? ''))
      setError('')
    }
    reader.readAsText(file)
  }

  const keyCount = (() => {
    if (!json.trim()) return null
    try {
      const parsed = JSON.parse(json) as unknown
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
      return Object.keys(parsed).length
    } catch {
      return null
    }
  })()

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('importTitle')}</DialogTitle>
          <DialogDescription>
            {t('importDescription', { locale: localeLabel })}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
            {t('importWarning')}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={saving}
            >
              <Upload className="size-3.5" aria-hidden="true" />
              {t('importFile')}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={readFile}
            />
            {keyCount !== null && (
              <span className="text-xs text-muted-foreground">
                {t('importSummary', { count: keyCount })}
              </span>
            )}
          </div>

          <Textarea
            dir="ltr"
            rows={8}
            value={json}
            onChange={(event) => {
              setJson(event.target.value)
              setError('')
            }}
            placeholder={'{\n  "cart.empty_message": "Your cart is empty"\n}'}
            aria-label={t('importJson')}
            className="font-mono text-xs"
            disabled={saving}
            aria-invalid={Boolean(error)}
          />

          {error ? (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => changeOpen(false)}
            disabled={saving}
          >
            {t('cancel')}
          </Button>
          <Button
            type="button"
            onClick={() => void submit()}
            disabled={saving || !json.trim()}
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <FileJson className="size-4" aria-hidden="true" />
            )}
            {saving ? t('saving') : t('importConfirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
