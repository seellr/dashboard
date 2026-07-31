'use client'

import { useState } from 'react'

interface LangTabsProps {
  ar: React.ReactNode
  en: React.ReactNode
  defaultLang?: 'ar' | 'en'
  label?: string
}

export function LangTabs({ ar, en, defaultLang = 'ar', label }: LangTabsProps) {
  const [lang, setLang] = useState<'ar' | 'en'>(defaultLang)

  return (
    <div className="rounded-lg border bg-muted/30">
      {/* Header: optional label + toggle in one row */}
      <div className="flex items-center gap-3 border-b px-4 py-2">
        {label && <span className="text-sm font-medium text-muted-foreground">{label}</span>}
        <div className="flex gap-1 rounded-md border bg-background p-0.5 ms-auto">
          <button
            type="button"
            onClick={() => setLang('ar')}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              lang === 'ar'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            🇸🇦 AR
          </button>
          <button
            type="button"
            onClick={() => setLang('en')}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              lang === 'en'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            🇬🇧 EN
          </button>
        </div>
      </div>
      {/* Fields */}
      <div className="flex flex-col gap-3 p-4">
        {lang === 'ar' ? ar : en}
      </div>
    </div>
  )
}
