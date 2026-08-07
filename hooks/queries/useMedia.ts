import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminFetchClient } from '@/lib/admin/api-client'

export interface MediaItem {
  ulid: string
  name: string
  original_name: string
  url: string
  thumb_url: string | null
  mime_type: string
  file_size: number
  file_size_kb: number
  width: number | null
  height: number | null
  alt_text: string | null
  folder: string | null
  is_image: boolean
  created_at: string
}

interface ApiMeta {
  per_page: number
  next_cursor: string | null
  has_more: boolean
}

export const mediaQueryKey = (folder?: string, search?: string, type?: string) =>
  ['admin', 'media', folder ?? null, search ?? null, type ?? null] as const

export function useMediaList(params?: { folder?: string; search?: string; type?: string }) {
  const qs = new URLSearchParams()
  if (params?.folder) qs.set('folder', params.folder)
  if (params?.search) qs.set('search', params.search)
  if (params?.type) qs.set('type', params.type)
  const queryString = qs.toString() ? `?${qs.toString()}` : ''

  return useQuery({
    queryKey: mediaQueryKey(params?.folder, params?.search, params?.type),
    queryFn: async () => {
      // Backend returns { success: true, data: [...items], meta: { per_page, next_cursor, has_more } }
      // adminFetchClient maps: result.data = json.data (the items array), result.meta = json.meta
      const result = await adminFetchClient<MediaItem[]>(`/media${queryString}`)
      if (!result.ok) throw new Error(result.message)
      const meta = result.meta as ApiMeta | undefined
      return {
        items: result.data ?? [],
        per_page: meta?.per_page ?? 20,
        next_cursor: meta?.next_cursor ?? null,
        has_more: meta?.has_more ?? false,
      }
    },
    staleTime: 30_000,
  })
}

export function useMediaFolders() {
  return useQuery({
    queryKey: ['admin', 'media', 'folders'],
    queryFn: async () => {
      const result = await adminFetchClient<string[]>('/media/folders')
      if (!result.ok) throw new Error(result.message)
      return result.data ?? []
    },
    staleTime: 60_000,
  })
}

export function useUploadMedia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ file, folder, altText }: { file: File; folder?: string; altText?: string }) => {
      const form = new FormData()
      form.append('file', file)
      if (folder) form.append('folder', folder)
      if (altText) form.append('alt_text', altText)

      const locale = typeof document !== 'undefined' ? document.documentElement.lang : 'en'
      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        headers: { 'x-locale': locale },
        body: form,
      })
      const json = await res.json().catch(() => ({}))
      return { ok: res.ok && json.success, data: json.data as MediaItem, message: json.message }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'media'] })
    },
  })
}

export function useDeleteMedia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ulid: string) => adminFetchClient(`/media/${ulid}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'media'] })
    },
  })
}
