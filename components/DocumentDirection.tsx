'use client'

import { useEffect } from 'react'

export function DocumentDirection({ locale, dir }: { locale: string; dir: 'rtl' | 'ltr' }) {
  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = dir
  }, [locale, dir])

  return null
}
