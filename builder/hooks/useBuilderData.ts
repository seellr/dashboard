'use client'

import { useQuery } from '@tanstack/react-query'
import { BuilderApiError, subscriberThemeApi } from '@/api/client'
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

/**
 * Request failures from `builderFetch` carry the HTTP status and the backend
 * message. Surfacing them in the banner is the difference between "something
 * is wrong" and knowing whether the route 401s, 404s, or rejects the payload.
 */
function describeRequestFailure(error: unknown): string {
  if (error instanceof BuilderApiError) {
    const code = error.code ? ` (${error.code})` : ''
    const fields = error.fields
      ? Object.entries(error.fields)
          .map(([field, messages]) => `${field}: ${messages.join('; ')}`)
          .join(' | ')
      : ''
    return `HTTP ${error.status}${code}: ${error.message}${fields ? ` — ${fields}` : ''}`
  }
  if (error instanceof Error) return error.message
  return 'Unknown error'
}

function invalidPayloadError(resource: string, issues: unknown): Error {
  if (process.env.NODE_ENV !== 'production' && issues) {
    // Keep the thrown message short; the full payload is in console.error.
    const first = JSON.stringify(issues).slice(0, 180)
    return new Error(`Invalid ${resource} response: ${first}`)
  }
  return new Error(`Invalid ${resource} response`)
}

/**
 * A 401/404/422 will not become a success on retry; only retry transient 5xx.
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  return failureCount < 2 && error instanceof BuilderApiError && error.status >= 500
}

export function useBuilderSchema(locale: Locale) {
  return useQuery({
    queryKey: ['builder-schema', locale],
    retry: shouldRetry,
    queryFn: async (): Promise<ThemeSchema> => {
      try {
        const response = await subscriberThemeApi.getSchema(locale)
        const parsed = themeSchemaResponseSchema.safeParse(response.data)
        if (!parsed.success) {
          const issues = parsed.error.flatten()
          reportInvalidPayload('theme schema', issues, response.data)
          throw invalidPayloadError('theme schema', issues)
        }
        return parsed.data as ThemeSchema
      } catch (error) {
        if (error instanceof BuilderApiError) {
          console.error('[builder] Theme schema request failed', error.status, error.code, error.message)
          throw new Error(describeRequestFailure(error))
        }
        throw error
      }
    },
  })
}

export function useBuilderPages(locale: Locale) {
  return useQuery({
    queryKey: ['builder-pages', locale],
    retry: shouldRetry,
    queryFn: async (): Promise<BuilderPage[]> => {
      try {
        const response = await subscriberThemeApi.listPages(locale)
        const parsed = builderPageListSchema.safeParse(response.data)
        if (!parsed.success) {
          const issues = parsed.error.flatten()
          reportInvalidPayload('pages', issues, response.data)
          throw invalidPayloadError('pages', issues)
        }
        return parsed.data as BuilderPage[]
      } catch (error) {
        if (error instanceof BuilderApiError) {
          console.error('[builder] Pages request failed', error.status, error.code, error.message)
          throw new Error(describeRequestFailure(error))
        }
        throw error
      }
    },
  })
}

export function useBuilderDraft(locale: Locale, pageUlid: string | undefined) {
  return useQuery({
    queryKey: ['builder-draft', locale, pageUlid],
    retry: shouldRetry,
    enabled: Boolean(pageUlid),
    queryFn: async (): Promise<BuilderPage> => {
      try {
        const response = await subscriberThemeApi.getDraft(locale, pageUlid ?? '')
        const parsed = builderPageSchema.safeParse(response.data)
        if (!parsed.success) {
          const issues = parsed.error.flatten()
          reportInvalidPayload('page draft', issues, response.data)
          throw invalidPayloadError('page draft', issues)
        }
        return parsed.data as BuilderPage
      } catch (error) {
        if (error instanceof BuilderApiError) {
          console.error('[builder] Page draft request failed', error.status, error.code, error.message)
          throw new Error(describeRequestFailure(error))
        }
        throw error
      }
    },
  })
}
