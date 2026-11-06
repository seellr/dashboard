'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Check, Copy, Globe2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  createSellerDomain,
  deleteSellerDomain,
  listSellerDomains,
  setPrimarySellerDomain,
  verifySellerDomain,
  type SellerDomain,
} from '@/lib/seller/resource-client'

const HOSTNAME_REGEX = /^(?!-)[A-Za-z0-9-]{1,63}(?:\.[A-Za-z0-9-]{1,63})+$/

export function SellerDomainsClient() {
  const t = useTranslations('seller.domains')
  const [items, setItems] = useState<SellerDomain[]>([])
  const [domain, setDomain] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [instruction, setInstruction] = useState<{
    domain: string
    text: string
  } | null>(null)
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    const result = await listSellerDomains()
    if (result.ok) setItems(result.data)
    else setMessage(result.message)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  const add = async (event: FormEvent) => {
    event.preventDefault()
    const value = domain.trim().toLowerCase()
    if (!HOSTNAME_REGEX.test(value) || value.length > 255) {
      setMessage(t('invalidHostname'))
      return
    }
    setBusy('create')
    setMessage('')
    const result = await createSellerDomain(value)
    setBusy(null)
    if (!result.ok) {
      setMessage(result.message)
      return
    }
    setDomain('')
    await load()
    if (result.data.verification_instruction) {
      setInstruction({
        domain: result.data.domain,
        text: result.data.verification_instruction,
      })
    }
  }

  const run = async (
    id: string,
    action: () => Promise<{ ok: boolean; message?: string }>,
  ) => {
    setBusy(id)
    setMessage('')
    const result = await action()
    setBusy(null)
    if (!result.ok) setMessage(result.message ?? t('genericError'))
    else await load()
  }

  return (
    <section className="space-y-4">
      <form onSubmit={(event) => void add(event)} className="flex max-w-xl gap-2">
        <Input
          value={domain}
          onChange={(event) => setDomain(event.target.value)}
          placeholder={t('placeholder')}
          aria-label={t('placeholder')}
          maxLength={255}
          required
        />
        <Button type="submit" disabled={busy === 'create'}>
          {busy === 'create' ? t('adding') : t('add')}
        </Button>
      </form>

      <p className="max-w-2xl text-xs text-muted-foreground">{t('hint')}</p>

      {message && (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      )}

      <div className="divide-y rounded-lg border">
        {items.length === 0 && (
          <div className="flex flex-col items-center gap-2 p-8 text-center">
            <Globe2 className="size-8 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">{t('empty')}</p>
          </div>
        )}
        {items.map((item) => (
          <div
            key={item.ulid}
            className="flex flex-wrap items-center justify-between gap-3 p-4"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{item.domain}</p>
              <p className="text-sm text-muted-foreground">
                {item.verified ? t('verified') : t('notVerified')}
                {item.is_primary ? ` · ${t('primary')}` : ''}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {!item.verified && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busy === item.ulid}
                  onClick={() =>
                    void run(item.ulid, () => verifySellerDomain(item.ulid))
                  }
                >
                  {t('verify')}
                </Button>
              )}
              {item.verified && !item.is_primary && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busy === item.ulid}
                  onClick={() =>
                    void run(item.ulid, () => setPrimarySellerDomain(item.ulid))
                  }
                >
                  {t('makePrimary')}
                </Button>
              )}
              <Button
                variant="destructive"
                size="sm"
                disabled={busy === item.ulid}
                onClick={() => {
                  if (!window.confirm(t('confirmDelete', { domain: item.domain })))
                    return
                  void run(item.ulid, () => deleteSellerDomain(item.ulid))
                }}
              >
                {t('remove')}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {instruction && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="domain-dns-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        >
          <div className="w-full max-w-lg space-y-4 rounded-xl bg-background p-6 shadow-xl">
            <div>
              <h2 id="domain-dns-title" className="text-lg font-semibold">
                {t('dnsTitle')}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('dnsDescription', { domain: instruction.domain })}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="break-all font-mono text-sm">{instruction.text}</p>
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              {t('dnsWarning')}
            </p>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => {
                  void navigator.clipboard.writeText(instruction.text).then(() => {
                    setCopied(true)
                    window.setTimeout(() => setCopied(false), 1500)
                  })
                }}
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? t('copied') : t('copy')}
              </Button>
              <Button type="button" onClick={() => setInstruction(null)}>
                {t('done')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
