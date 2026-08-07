import { z } from 'zod'

export const QuizAnswerSchema = z.object({
  id: z.number(),
  score: z.number(),
  sort_order: z.number(),
  tags: z.array(z.string()),
  text: z.string(),
})
export type QuizAnswer = z.infer<typeof QuizAnswerSchema>

export const QuizQuestionSchema = z.object({
  id: z.number(),
  sort_order: z.number(),
  text: z.string(),
  answers: z.array(QuizAnswerSchema).optional(),
})
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>

export const QuizArchetypeSchema = z.object({
  id: z.number(),
  slug: z.string(),
  min_score: z.number(),
  max_score: z.number(),
  name: z.string(),
  headline: z.string(),
  description: z.string(),
})
export type QuizArchetype = z.infer<typeof QuizArchetypeSchema>

export const QuizSchema = z.object({
  ulid: z.string(),
  slug: z.string(),
  type: z.number(),
  active: z.boolean(),
  title: z.string(),
  description: z.string().nullable(),
  questions: z.array(QuizQuestionSchema).optional(),
  archetypes: z.array(QuizArchetypeSchema).optional(),
  created_at: z.string(),
})
export type Quiz = z.infer<typeof QuizSchema>
