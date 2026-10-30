import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  bulkDeleteMedia,
  deleteMedia,
  deleteProductGalleryImage,
  getFolders,
  getMedia,
  listMedia,
  updateMedia,
  uploadMedia,
  uploadMediaMultiple,
  uploadProductGalleryImage,
  uploadProductHeroImage,
  type ListMediaParams,
  type UploadMediaOptions,
} from '@/lib/admin/media-client'
import type { MediaResource, UpdateMediaInput } from '@/types/dto/media.dto'

export type { MediaResource, UpdateMediaInput }
export type MediaItem = MediaResource

export const mediaQueryKeys = {
  all: ['admin', 'media'] as const,
  lists: () => [...mediaQueryKeys.all, 'list'] as const,
  list: (params?: ListMediaParams) => [...mediaQueryKeys.lists(), params ?? {}] as const,
  folders: () => [...mediaQueryKeys.all, 'folders'] as const,
  detail: (ulid: string) => [...mediaQueryKeys.all, 'detail', ulid] as const,
  productImages: (productUlid: string) => ['admin', 'products', productUlid, 'images'] as const,
}

export function useMediaList(params?: ListMediaParams) {
  return useQuery({
    queryKey: mediaQueryKeys.list(params),
    queryFn: async () => {
      const res = await listMedia(params)
      if (!res.ok) {
        throw new Error(res.message || 'Failed to fetch media list')
      }
      return {
        items: res.data ?? [],
        meta: res.meta ?? { per_page: 20, next_cursor: null, has_more: false },
      }
    },
    staleTime: 30_000,
  })
}

export function useMediaFolders() {
  return useQuery({
    queryKey: mediaQueryKeys.folders(),
    queryFn: async () => {
      const res = await getFolders()
      if (!res.ok) {
        throw new Error(res.message || 'Failed to fetch media folders')
      }
      return res.data ?? []
    },
    staleTime: 60_000,
  })
}

export function useMediaItem(ulid?: string | null) {
  return useQuery({
    queryKey: mediaQueryKeys.detail(ulid ?? ''),
    queryFn: async () => {
      if (!ulid) return null
      const res = await getMedia(ulid)
      if (!res.ok) throw new Error(res.message || 'Failed to fetch media item')
      return res.data
    },
    enabled: Boolean(ulid),
  })
}

export function useUploadMedia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      file,
      options,
      onProgress,
      signal,
    }: {
      file: File
      options?: UploadMediaOptions
      onProgress?: (percent: number) => void
      signal?: AbortSignal
    }) => uploadMedia(file, options, onProgress, signal),
    onSuccess: (res) => {
      if (res.ok) {
        qc.invalidateQueries({ queryKey: mediaQueryKeys.all })
      }
    },
  })
}

export function useUploadMediaMultiple() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      files,
      options,
      onProgress,
      signal,
    }: {
      files: File[]
      options?: { folder?: string }
      onProgress?: (percent: number) => void
      signal?: AbortSignal
    }) => uploadMediaMultiple(files, options, onProgress, signal),
    onSuccess: (res) => {
      if (res.ok) {
        qc.invalidateQueries({ queryKey: mediaQueryKeys.all })
      }
    },
  })
}

export function useUpdateMedia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ ulid, data }: { ulid: string; data: UpdateMediaInput }) =>
      updateMedia(ulid, data),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: mediaQueryKeys.all })
      qc.invalidateQueries({ queryKey: mediaQueryKeys.detail(vars.ulid) })
    },
  })
}

export function useDeleteMedia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ulid: string) => deleteMedia(ulid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mediaQueryKeys.all })
    },
  })
}

export function useBulkDeleteMedia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ulids: string[]) => bulkDeleteMedia(ulids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mediaQueryKeys.all })
    },
  })
}

export function useUploadHeroImage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      productUlid,
      file,
      onProgress,
      signal,
    }: {
      productUlid: string
      file: File
      onProgress?: (percent: number) => void
      signal?: AbortSignal
    }) => uploadProductHeroImage(productUlid, file, onProgress, signal),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'products', vars.productUlid] })
      qc.invalidateQueries({ queryKey: ['admin', 'products'] })
    },
  })
}

export function useUploadGalleryImage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      productUlid,
      file,
      altText,
      onProgress,
      signal,
    }: {
      productUlid: string
      file: File
      altText?: string
      onProgress?: (percent: number) => void
      signal?: AbortSignal
    }) => uploadProductGalleryImage(productUlid, file, altText, onProgress, signal),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'products', vars.productUlid] })
    },
  })
}

export function useDeleteGalleryImage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      productUlid,
      imageId,
    }: {
      productUlid: string
      imageId: number | string
    }) => deleteProductGalleryImage(productUlid, imageId),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'products', vars.productUlid] })
    },
  })
}
