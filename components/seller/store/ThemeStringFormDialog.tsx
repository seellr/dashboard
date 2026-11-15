'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  THEME_STRING_LOCALES,
  type ThemeStringEntry,
  type ThemeStringLocale,
} from '@/lib/seller/theme-strings'

export interface ThemeStringDraft {
  key: string
  value: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  locale: ThemeStringLocale
  /** `null` opens the dialog in create mode. */
  initial: ThemeStringEntry | null
  existingKeys: ReadonlySet<string>
  onSubmit: (draft: ThemeStringDraft) => Promise<boolean>
}

const MAX_KEY_LENGTH = 191
const MAX_VALUE_LENGTH = 2000

/**
 * One dialog for both create and edit. The API is an upsert
 * (`PUT /subscriber/theme/locale/{locale}/{key}`), but the key is part of the
 * URL, so renaming is not supported: in edit mode the key is read-only.
 */
export function ThemeStringFormDialog({
  open,
  onOpenChange,
  locale,
  initial,
  existingKeys,
  onSubmit,
}: Props) {
  const t = useTranslations('seller.theme.strings')
  const editing = initial !== null
  const localeLabel =
    THEME_STRING_LOCALES.find((item) => item.value === locale)?.label ?? locale
  const [saving, setSaving] = useState(false)

  const form = useForm<ThemeStringDraft>({
    defaultValues: initial
      ? { key: initial.key, value: initial.value }
      : { key: '', value: '' },
    mode: 'onSubmit',
  })
  const { register, handleSubmit, reset, setError, formState } = form
  const errors = formState.errors

  useEffect(() => {
    if (!open) return
    reset(
      initial
        ? { key: initial.key, value: initial.value }
        : { key: '', value: '' },
    )
  }, [open, initial, reset])

  const submit = handleSubmit(async (values) => {
    const key = values.key.trim()
    if (!editing && existingKeys.has(key)) {
      setError('key', { message: t('keyExists') })
      return
    }
    setSaving(true)
    const ok = await onSubmit({ key, value: values.value })
    setSaving(false)
    if (ok) onOpenChange(false)
  })

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? t('editTitle') : t('addTitle')}</DialogTitle>
          <DialogDescription>
            {initial
              ? t('editDescription', { key: initial.key, locale: localeLabel })
              : t('addDescription', { locale: localeLabel })}
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={submit} noValidate>
          <div className="grid gap-1.5">
            <Label htmlFor="theme-string-key">{t('key')}</Label>
            <Input
              id="theme-string-key"
              dir="ltr"
              autoComplete="off"
              spellCheck={false}
              className="font-mono text-xs"
              placeholder={t('keyPlaceholder')}
              disabled={editing || saving}
              aria-invalid={Boolean(errors.key)}
              {...register('key', {
                validate: (value) => {
                  const key = value.trim()
                  if (!key) return t('keyRequired')
                  if (/\s/.test(key)) return t('keySpaces')
                  if (key.length > MAX_KEY_LENGTH) return t('keyTooLong')
                  return true
                },
              })}
            />
            {errors.key?.message ? (
              <p className="text-xs text-destructive">{errors.key.message}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {editing ? t('keyLocked') : t('keyHint')}
              </p>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="theme-string-value">{t('value')}</Label>
            <Textarea
              id="theme-string-value"
              dir="auto"
              rows={3}
              maxLength={MAX_VALUE_LENGTH}
              placeholder={t('value')}
              disabled={saving}
              aria-invalid={Boolean(errors.value)}
              {...register('value', {
                validate: (value) => {
                  if (!value.trim()) return t('valueRequired')
                  if (value.length > MAX_VALUE_LENGTH) return t('valueTooLong')
                  return true
                },
              })}
            />
            {errors.value?.message ? (
              <p className="text-xs text-destructive">{errors.value.message}</p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {saving ? t('saving') : t('save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
