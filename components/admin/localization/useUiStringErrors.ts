'use client'

import { useTranslations } from 'next-intl'

export function useUiStringErrors() {
  const t = useTranslations('admin.localization.errors')

  return (errorCode: string, fallback: string): string => {
    switch (errorCode) {
      case 'invalid_locale':
        return t('invalidLocale')
      case 'locale_key_not_found':
        return t('keyNotFound')
      case 'brand_not_found':
        return t('brandNotFound')
      case 'theme_not_found':
        return t('themeNotFound')
      default:
        return fallback
    }
  }
}