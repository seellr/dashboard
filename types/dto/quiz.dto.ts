import { z } from 'zod'
import type { Product } from './product.dto'

// ── Translations ────────────────────────────────────────────────────────────
// Per QUIZ_API_FOR_FRONTEND.md:
// Quiz endpoints use a LIST of translation entries, with `locale` inside each entry:
// `translations: [ { locale: "ar", title: "..." }, { locale: "en", title: "..." } ]`

export type QuizTranslationEntry = { locale: string; title: string; description?: string | null }
export type QuestionTranslationEntry = { locale: string; text: string }
export type AnswerTranslationEntry = { locale: string; text: string }
export type ArchetypeTranslationEntry = { locale: string; name: string; headline: string; description: string }

// Reads the per-locale translation object from either the list shape ([{ locale, ... }])
// or the object shape ({ ar: {...} }).
export function getLocaleEntry(
  translations: unknown,
  locale: string,
): Record<string, unknown> | undefined {
  if (!translations) return undefined
  if (Array.isArray(translations)) {
    return (translations as { locale: string }[]).find((t) => t.locale === locale) as
      | Record<string, unknown>
      | undefined
  }
  return (translations as Record<string, Record<string, unknown>>)[locale]
}

// Resolves the numeric quiz `type` (1 = Free, 2 = Paid) from either the number
// shape or the object shape ({ id, label }).
export function getQuizTypeId(
  type: Quiz['type'] | number | { id: number; label: string } | null | undefined,
): number {
  if (type === null || type === undefined) return 1
  if (typeof type === 'object') return type.id ?? 1
  return Number(type) || 1
}

export const QuizAnswerSchema = z.object({
  id: z.number(),
  score: z.number(),
  sort_order: z.number(),
  tags: z.array(z.string()).optional().default([]),
  text: z.string().optional().default(''),
  translations: z.array(z.object({ locale: z.string(), text: z.string() })).optional(),
})
export type QuizAnswer = z.infer<typeof QuizAnswerSchema>

export const QuizQuestionSchema = z.object({
  id: z.number(),
  type: z.union([z.number(), z.object({ id: z.number(), label: z.string() })]).optional(),
  sort_order: z.number(),
  text: z.string().optional().default(''),
  answers: z.array(QuizAnswerSchema).optional().default([]),
  translations: z.array(z.object({ locale: z.string(), text: z.string() })).optional(),
})
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>

// Resolves the numeric question `type` (1 = Single Choice, 2 = Multiple Choice)
// from either the number shape or the object shape ({ id, label }).
export function getQuestionTypeId(
  type: QuizQuestion['type'] | null,
): number {
  if (type === null || type === undefined) return 1
  if (typeof type === 'object') return type.id ?? 1
  return Number(type) || 1
}

export const QuizArchetypeSchema = z.object({
  id: z.number(),
  slug: z.string(),
  min_score: z.number(),
  max_score: z.number(),
  name: z.string().optional().default(''),
  headline: z.string().optional().default(''),
  description: z.string().optional().default(''),
  products: z.array(z.custom<Product>()).optional().default([]),
  translations: z.array(z.object({ locale: z.string(), name: z.string(), headline: z.string(), description: z.string() })).optional(),
})
export type QuizArchetype = z.infer<typeof QuizArchetypeSchema>

export const QuizSchema = z.object({
  ulid: z.string(),
  slug: z.string(),
  type: z.union([z.number(), z.object({ id: z.number(), label: z.string() })]),
  active: z.boolean(),
  collect_email_before_result: z.boolean().optional().default(true),
  title: z.string().optional().default(''),
  description: z.string().nullable().optional(),
  questions: z.array(QuizQuestionSchema).optional().default([]),
  archetypes: z.array(QuizArchetypeSchema).optional().default([]),
  created_at: z.string(),
  translations: z.array(z.object({ locale: z.string(), title: z.string(), description: z.string().nullable().optional() })).optional(),
})
export type Quiz = z.infer<typeof QuizSchema>

export interface CreateQuizInput {
  slug: string
  brand_id?: number
  type: number
  active?: boolean
  collect_email_before_result?: boolean
  product_id?: string
  translations: QuizTranslationEntry[]
}

export interface UpdateQuizInput {
  slug?: string
  brand_id?: number
  type?: number
  active?: boolean
  collect_email_before_result?: boolean
  product_id?: string
  translations?: QuizTranslationEntry[]
}

export interface CreateQuestionInput {
  type?: number
  sort_order: number
  translations: QuestionTranslationEntry[]
}

export interface CreateAnswerInput {
  score: number
  sort_order: number
  tags?: string[]
  translations: AnswerTranslationEntry[]
}

export interface CreateArchetypeInput {
  slug: string
  min_score: number
  max_score: number
  translations: ArchetypeTranslationEntry[]
}

export interface QuizSubmissionAnswerItem {
  question_id: number
  answer_ids: number[]
}

export interface QuizSubmissionInput {
  email?: string
  customer_id?: number
  answers: QuizSubmissionAnswerItem[]
}

export interface QuizSubmissionResult {
  ulid?: string
  archetype: QuizArchetype
  score?: number
  total_score?: number
  products?: Product[]
}
