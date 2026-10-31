import { z } from 'zod'

export const ALLOWED_MEDIA_EXTENSIONS = [
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'svg',
  'pdf',
  'mp4',
  'webm',
  'zip',
  'csv',
  'xlsx',
  'docx',
] as const

export type AllowedMediaExtension = (typeof ALLOWED_MEDIA_EXTENSIONS)[number]

export const ALLOWED_MEDIA_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'video/mp4',
  'video/webm',
  'application/zip',
  'application/x-zip-compressed',
  'text/csv',
  'application/vnd.ms-excel',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const

export const MAX_MEDIA_FILE_SIZE = 20 * 1024 * 1024 // Backend limit: 20MB
export const MAX_MEDIA_BATCH_COUNT = 20

export const ALLOWED_PRODUCT_IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp'] as const
export const ALLOWED_PRODUCT_IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
] as const
export const MAX_PRODUCT_IMAGE_SIZE = 4 * 1024 * 1024 // 4MB

export const FOLDER_REGEX = /^[a-zA-Z0-9\/\-_]+$/

// ── Resource Schemas ────────────────────────────────────────────────────────

export const MediaResourceSchema = z.object({
  ulid: z.string(),
  name: z.string(),
  original_name: z.string(),
  url: z.string(),
  thumb_url: z.string().nullable(),
  mime_type: z.string(),
  file_size: z.number(),
  file_size_kb: z.number(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  alt_text: z.string().nullable(),
  folder: z.string().nullable(),
  is_image: z.boolean(),
  created_at: z.string(),
})

export type MediaResource = z.infer<typeof MediaResourceSchema>

export const MediaListMetaSchema = z.object({
  per_page: z.number(),
  next_cursor: z.string().nullable(),
  has_more: z.boolean(),
})

export type MediaListMeta = z.infer<typeof MediaListMetaSchema>

export const MediaListResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(MediaResourceSchema),
  meta: MediaListMetaSchema,
  message: z.string().optional(),
})

export type MediaListResponse = z.infer<typeof MediaListResponseSchema>

export const MediaSingleResponseSchema = z.object({
  success: z.boolean(),
  data: MediaResourceSchema,
  message: z.string().optional(),
})

export type MediaSingleResponse = z.infer<typeof MediaSingleResponseSchema>

// ── Mutation Schemas ────────────────────────────────────────────────────────

export const UpdateMediaSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name must not exceed 200 characters').optional(),
  alt_text: z.string().max(500, 'Alt text must not exceed 500 characters').nullable().optional(),
  folder: z
    .string()
    .max(200, 'Folder name must not exceed 200 characters')
    .regex(FOLDER_REGEX, 'Folder name may only contain letters, numbers, hyphens, underscores, and forward slashes')
    .nullable()
    .optional(),
})

export type UpdateMediaInput = z.infer<typeof UpdateMediaSchema>

export const BulkDeleteSchema = z.object({
  ulids: z.array(z.string().min(1, 'ULID cannot be empty')).min(1, 'At least one ULID must be provided'),
})

export type BulkDeleteInput = z.infer<typeof BulkDeleteSchema>

// ── Validation Helpers ──────────────────────────────────────────────────────

export function getFileExtension(filename: string): string {
  const parts = filename.split('.')
  return parts.length > 1 ? (parts.pop()?.toLowerCase() ?? '') : ''
}

export function isAllowedMediaFile(filename: string, mimeType?: string): boolean {
  const ext = getFileExtension(filename)
  if (ALLOWED_MEDIA_EXTENSIONS.includes(ext as AllowedMediaExtension)) {
    return true
  }
  if (mimeType && (ALLOWED_MEDIA_MIME_TYPES as readonly string[]).includes(mimeType)) {
    return true
  }
  return false
}

export function isAllowedProductImage(filename: string, mimeType?: string): boolean {
  const ext = getFileExtension(filename)
  if ((ALLOWED_PRODUCT_IMAGE_EXTENSIONS as readonly string[]).includes(ext)) {
    return true
  }
  if (mimeType && (ALLOWED_PRODUCT_IMAGE_MIME_TYPES as readonly string[]).includes(mimeType)) {
    return true
  }
  return false
}
