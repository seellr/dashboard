'use client'

import { useQuery } from '@tanstack/react-query'
import { subscriberThemeApi } from '@/api/client'
import { builderPageListSchema, builderPageSchema, themeSchemaResponseSchema } from '@/shared/schemas/builder'
import type { BuilderPage, Locale, ThemeSchema } from '@/shared/types/builder'

/**
 * Server payloads for the builder are documented only as endpoint names, so a
 * shape mismatch must be visible in development instead of turning into a
 * generic "offline" banner. The thrown messages are used by EditorShell.
 */
function reportInvalidPayload(resource: string, error: unknown, payload: unknown): void {
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[builder] Invalid ${resource} response`, error, payload)
  }
}

export function useBuilderSchema(locale: Locale) {
  return useQuery({
    queryKey: ['builder-schema', locale],
    queryFn: async (): Promise<ThemeSchema> => {
      const response = await subscriberThemeApi.getSchema(locale)
      const parsed = themeSchemaResponseSchema.safeParse(response.data)
      if (!parsed.success) {
        reportInvalidPayload('theme schema', parsed.error.flatten(), response.data)
        throw new Error('Invalid theme schema response')
      }
      return parsed.data as ThemeSchema
    },
  })
}

export function useBuilderPages(locale: Locale) {
  return useQuery({
    queryKey: ['builder-pages', locale],
    queryFn: async (): Promise<BuilderPage[]> => {
      const response = await subscriberThemeApi.listPages(locale)
      const parsed = builderPageListSchema.safeParse(response.data)
      if (!parsed.success) {
        reportInvalidPayload('pages', parsed.error.flatten(), response.data)
        throw new Error('Invalid pages response')
      }
      return parsed.data as BuilderPage[]
    },
  })
}

export function useBuilderDraft(locale: Locale, pageUlid: string | undefined) {
  return useQuery({
    queryKey: ['builder-draft', locale, pageUlid],
    enabled: Boolean(pageUlid),
    queryFn: async (): Promise<BuilderPage> => {
      const response = await subscriberThemeApi.getDraft(locale, pageUlid ?? '')
      const parsed = builderPageSchema.safeParse(response.data)
      if (!parsed.success) {
        reportInvalidPayload('page draft', parsed.error.flatten(), response.data)
        throw new Error('Invalid draft response')
      }
      return parsed.data as BuilderPage
    },
  })
}
