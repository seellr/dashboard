import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminFetchClient } from '@/lib/admin/api-client'
import type { ApiResult } from '@/lib/admin/api-server'
import {
  normalizeStringMap,
  uiStringExportPath,
  uiStringImportPath,
  uiStringKeyPath,
  uiStringOverridesPath,
  uiStringResolvedPath,
  type UiStringId,
  type UiStringLocale,
  type UiStringMap,
  type UiStringScope,
} from '@/lib/admin/ui-strings'

export const uiStringsQueryKey = (scope: UiStringScope, id: UiStringId, locale: UiStringLocale) =>
  ['admin', 'ui-strings', scope, id, locale] as const

async function unwrap<T>(pending: Promise<ApiResult<T>>): Promise<T> {
  const result = await pending
  if (!result.ok) throw new Error(result.message)
  return result.data
}

export function useUiStringsResolved(scope: UiStringScope, id: UiStringId, locale: UiStringLocale) {
  return useQuery({
    queryKey: [...uiStringsQueryKey(scope, id, locale), 'resolved'],
    queryFn: async () =>
      normalizeStringMap(await unwrap<unknown>(adminFetchClient(uiStringResolvedPath(scope, id, locale)))),
    enabled: id !== '' && id !== null && id !== undefined,
  })
}

export function useUiStringsOverrides(scope: UiStringScope, id: UiStringId, locale: UiStringLocale) {
  return useQuery({
    queryKey: [...uiStringsQueryKey(scope, id, locale), 'overrides'],
    queryFn: async () =>
      normalizeStringMap(await unwrap<unknown>(adminFetchClient(uiStringOverridesPath(scope, id, locale)))),
    enabled: id !== '' && id !== null && id !== undefined,
  })
}

export function useUpsertUiString(scope: UiStringScope, id: UiStringId, locale: UiStringLocale) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      adminFetchClient(uiStringKeyPath(scope, id, locale, key), {
        method: 'PUT',
        body: JSON.stringify({ value }),
      }),
    onSuccess: (result) => {
      if (result.ok) queryClient.invalidateQueries({ queryKey: uiStringsQueryKey(scope, id, locale) })
    },
  })
}

export function useDeleteUiString(scope: UiStringScope, id: UiStringId, locale: UiStringLocale) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (key: string) => adminFetchClient(uiStringKeyPath(scope, id, locale, key), { method: 'DELETE' }),
    onSuccess: (result) => {
      if (result.ok) queryClient.invalidateQueries({ queryKey: uiStringsQueryKey(scope, id, locale) })
    },
  })
}

export function useExportUiStrings(scope: UiStringScope, id: UiStringId, locale: UiStringLocale) {
  return useMutation({
    mutationFn: () => adminFetchClient(uiStringExportPath(scope, id, locale)),
  })
}

export function useImportUiStrings(scope: UiStringScope, id: UiStringId, locale: UiStringLocale) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (strings: UiStringMap) =>
      adminFetchClient(uiStringImportPath(scope, id, locale), {
        method: 'POST',
        body: JSON.stringify({ strings }),
      }),
    onSuccess: (result) => {
      if (result.ok) queryClient.invalidateQueries({ queryKey: uiStringsQueryKey(scope, id, locale) })
    },
  })
}