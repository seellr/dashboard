import { z } from 'zod'

export const apiMetaSchema = z.object({
  per_page: z.number().optional(),
  next_cursor: z.string().nullable().default(null),
  has_more: z.boolean(),
})

export const apiEnvelopeSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.unknown().optional(),
  error_code: z.string().optional(),
  errors: z.record(z.string(), z.array(z.string())).optional(),
  meta: apiMetaSchema.optional(),
})

export type ParsedApiEnvelope = z.infer<typeof apiEnvelopeSchema>

export function parseJsonSafely(text: string): unknown | null {
  if (!text.trim()) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

function readMessage(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null || !('message' in payload)) return null
  const message = (payload as { message?: unknown }).message
  return typeof message === 'string' ? message : null
}

/**
 * Backend errors normally use the envelope, but a bad API key returns a bare
 * { message: "Wrong way!" }. Normalize both into one shape for callers.
 */
export function normalizeEnvelope(payload: unknown, status: number): ParsedApiEnvelope {
  const parsed = apiEnvelopeSchema.safeParse(payload)
  if (parsed.success) return parsed.data

  return {
    success: false,
    message: readMessage(payload) ?? `Request failed (${status})`,
    error_code: status === 401 ? 'unauthenticated' : 'invalid_response',
    errors: undefined,
  }
}
