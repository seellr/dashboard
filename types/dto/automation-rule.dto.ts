import { z } from 'zod'

export const AutomationRuleSchema = z.object({
  ulid: z.string(),
  name: z.string(),
  trigger_event: z.number(),
  conditions: z.array(z.unknown()),
  action_type: z.number(),
  action_value: z.string(),
  active: z.boolean(),
  created_at: z.string(),
})
export type AutomationRule = z.infer<typeof AutomationRuleSchema>

export const TRIGGER_EVENTS: Record<number, string> = {
  1: 'Purchase completed', 2: 'Cart abandoned', 3: 'Quiz completed',
  4: 'Email opened', 5: 'Email clicked', 6: 'Account registered',
  7: 'First purchase', 8: 'OTO accepted', 9: 'OTO declined',
}

export const ACTION_TYPES: Record<number, string> = {
  1: 'Add CRM tag', 2: 'Remove CRM tag', 3: 'Update buyer type',
  4: 'Enroll in email sequence', 5: 'Update CRM score',
}

export const CreateAutomationRuleSchema = z.object({
  name: z.string().min(1),
  trigger_event: z.number().int().min(1).max(9),
  conditions: z.array(z.unknown()).optional(),
  action_type: z.number().int().min(1).max(5),
  action_value: z.string().min(1),
  active: z.boolean(),
})
export type CreateAutomationRuleInput = z.infer<typeof CreateAutomationRuleSchema>
