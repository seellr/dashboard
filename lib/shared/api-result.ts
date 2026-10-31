export interface ApiMeta {
  per_page?: number
  next_cursor: string | null
  has_more: boolean
}

export interface ApiSuccess<T> {
  ok: true
  data: T
  meta?: ApiMeta
}

export interface ApiFailure {
  ok: false
  message: string
  errorCode: string
  errors: Record<string, string[]> | null
  status: number
}

export type ApiResult<T> = ApiSuccess<T> | ApiFailure

export function apiFailure(
  message: string,
  errorCode: string,
  status: number,
  errors: Record<string, string[]> | null = null,
): ApiFailure {
  return { ok: false, message, errorCode, errors, status }
}

export function isApiFailure<T>(result: ApiResult<T>): result is ApiFailure {
  return !result.ok
}
