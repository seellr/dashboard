'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { sileo } from 'sileo'
import { Search, Save, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { adminFetchClient } from '@/lib/admin/api-client'

interface LocaleString {
  key: string
  value: string
  default_value: string | null
  overridden: boolean
}

interface Props {
  initialStrings: { ar: LocaleString[]; en: LocaleString[] }
}

function LocaleStringRow({
  item,
  locale,
  onMutated,
}: {
  item: LocaleString
  locale: 'ar' | 'en'
  onMutated: () => void
}) {
  const [value, setValue] = useState(item.value)

  const upsert = useMutation({
    mutationFn: ({ key, val }: { key: string; val: string }) =>
      adminFetchClient(`/admin/brands/1/locale/${locale}/${encodeURIComponent(key)}`, {
        method: 'PUT',
        body: JSON.stringify({ value: val }),
      }),
    onSuccess: (res) => {
      if (!res.ok) sileo.error({ title: 'Could not save' })
      else { sileo.success({ title: 'Saved' }); onMutated() }
    },
  })

  const reset = useMutation({
    mutationFn: (key: string) =>
      adminFetchClient(`/admin/brands/1/locale/${locale}/${encodeURIComponent(key)}`, { method: 'DELETE' }),
    onSuccess: (res) => {
      if (!res.ok) sileo.error({ title: 'Could not reset' })
      else {
        setValue(item.default_value ?? '')
        sileo.success({ title: 'Reset to default' })
        onMutated()
      }
    },
  })

  const isDirty = value !== item.value

  return (
    <div className="grid grid-cols-[1fr_2fr_auto] gap-3 items-center px-4 py-3 border-b last:border-0 hover:bg-muted/30 transition-colors">
      <div className="flex flex-col gap-0.5">
        <code className="text-xs font-mono text-muted-foreground">{item.key}</code>
        {item.overridden && (
          <span className="text-xs text-amber-600 font-medium">overridden</span>
        )}
      </div>
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        dir={locale === 'ar' ? 'rtl' : 'ltr'}
        className={isDirty ? 'border-primary ring-1 ring-primary' : ''}
      />
      <div className="flex gap-1">
        {isDirty && (
          <Button
            type="button"
            size="sm"
            onClick={() => upsert.mutate({ key: item.key, val: value })}
            disabled={upsert.isPending}
          >
            <Save className="h-3.5 w-3.5" />
          </Button>
        )}
        {item.overridden && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => reset.mutate(item.key)}
            disabled={reset.isPending}
            title="Reset to default"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}

export function LocalizationClient({ initialStrings }: Props) {
  const router = useRouter()
  const [locale, setLocale] = useState<'ar' | 'en'>('ar')
  const [search, setSearch] = useState('')

  const strings = initialStrings[locale]

  const filtered = strings.filter(
    (s) =>
      s.key.toLowerCase().includes(search.toLowerCase()) ||
      s.value.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="flex gap-1 rounded-md border bg-background p-0.5">
          {(['ar', 'en'] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLocale(l)}
              className={`rounded px-4 py-1.5 text-sm font-medium transition-colors ${
                locale === l ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {l === 'ar' ? '🇸🇦 Arabic' : '🇬🇧 English'}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search keys or values…"
            className="pl-9"
          />
        </div>
        <span className="text-sm text-muted-foreground">{filtered.length} strings</span>
      </div>

      <div className="rounded-lg border">
        <div className="grid grid-cols-[1fr_2fr_auto] gap-3 px-4 py-2 bg-muted/50 border-b">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Key</span>
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Value</span>
          <span className="w-16" />
        </div>

        {filtered.length === 0 ? (
          <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">No strings found.</div>
        ) : (
          <div className="divide-y">
            {filtered.map((item) => (
              <LocaleStringRow
                key={`${locale}-${item.key}`}
                item={item}
                locale={locale}
                onMutated={() => router.refresh()}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
