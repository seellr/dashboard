'use client'

import { adminFetchClient } from './api-client'

/**
 * Typed admin endpoint coverage for modules that do not have a dedicated
 * client file. Paths omit the `/admin` prefix because `adminFetchClient`
 * talks to the authenticated `/api/admin` proxy.
 */

const id = (value: string | number) => encodeURIComponent(String(value))

// ── Orders ──────────────────────────────────────────────────────────────────

export const adminOrderApi = {
  list: (query = '') => adminFetchClient<unknown[]>(`/orders${query}`),
  get: (ulid: string) => adminFetchClient<unknown>(`/orders/${id(ulid)}`),
  confirmCod: (ulid: string) =>
    adminFetchClient<unknown>(`/orders/${id(ulid)}/confirm-cod`, { method: 'POST' }),
  invoice: (ulid: string) =>
    adminFetchClient<{ invoice_url: string }>(`/orders/${id(ulid)}/invoice`),
  createShipment: (ulid: string, body: ShippingAddressInput) =>
    adminFetchClient<unknown>(`/orders/${id(ulid)}/shipment`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
}

export interface ShippingAddressInput {
  name: string
  phone: string
  address_line1: string
  address_line2?: string | null
  city: string
  country?: string | null
}

// ── VAT ─────────────────────────────────────────────────────────────────────

export interface VatConfigInput {
  vat_rate: number
  vat_label: string
  vat_inclusive: boolean
  vat_enabled: boolean
}

export const adminVatApi = {
  get: () => adminFetchClient<unknown>('/vat-config'),
  update: (body: VatConfigInput) =>
    adminFetchClient<unknown>('/vat-config', { method: 'PUT', body: JSON.stringify(body) }),
}

// ── Funnel templates ────────────────────────────────────────────────────────

export const adminFunnelTemplateApi = {
  list: (query = '') => adminFetchClient<unknown[]>(`/funnel-templates${query}`),
  create: (body: Record<string, unknown>) =>
    adminFetchClient<unknown>('/funnel-templates', { method: 'POST', body: JSON.stringify(body) }),
  update: (ulid: string, body: Record<string, unknown>) =>
    adminFetchClient<unknown>(`/funnel-templates/${id(ulid)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  remove: (ulid: string) =>
    adminFetchClient<null>(`/funnel-templates/${id(ulid)}`, { method: 'DELETE' }),
  assign: (ulid: string, productUlid: string) =>
    adminFetchClient<null>(`/funnel-templates/${id(ulid)}/assign/${id(productUlid)}`, {
      method: 'POST',
    }),
  detach: (productUlid: string) =>
    adminFetchClient<null>(`/funnel-templates/detach/${id(productUlid)}`, { method: 'DELETE' }),
}

// ── Delivery ────────────────────────────────────────────────────────────────

export const adminDeliveryApi = {
  access: (productUlid: string, query = '') =>
    adminFetchClient<unknown[]>(`/delivery/access/${id(productUlid)}${query}`),
  grant: (body: { customer_ulid: string; product_ulid: string; expires_at?: string | null }) =>
    adminFetchClient<unknown>('/delivery/grant', { method: 'POST', body: JSON.stringify(body) }),
  revoke: (customerUlid: string, productUlid: string) =>
    adminFetchClient<unknown>(`/delivery/revoke/${id(customerUlid)}/${id(productUlid)}`, {
      method: 'DELETE',
    }),
}

// ── Shipping ────────────────────────────────────────────────────────────────

export interface ShippingMethodInput {
  name: string
  description?: string | null
  price: number
  estimated_days_min?: number | null
  estimated_days_max?: number | null
  is_active?: boolean
}

export const adminShippingApi = {
  list: () => adminFetchClient<unknown[]>('/shipping-methods'),
  create: (body: ShippingMethodInput) =>
    adminFetchClient<unknown>('/shipping-methods', { method: 'POST', body: JSON.stringify(body) }),
  update: (ulid: string, body: Partial<ShippingMethodInput>) =>
    adminFetchClient<unknown>(`/shipping-methods/${id(ulid)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  remove: (ulid: string) =>
    adminFetchClient<null>(`/shipping-methods/${id(ulid)}`, { method: 'DELETE' }),
}

// ── Quizzes ─────────────────────────────────────────────────────────────────

export const adminQuizApi = {
  list: (query = '') => adminFetchClient<unknown[]>(`/quizzes${query}`),
  get: (ulid: string) => adminFetchClient<unknown>(`/quizzes/${id(ulid)}`),
  create: (body: Record<string, unknown>) =>
    adminFetchClient<unknown>('/quizzes', { method: 'POST', body: JSON.stringify(body) }),
  update: (ulid: string, body: Record<string, unknown>) =>
    adminFetchClient<unknown>(`/quizzes/${id(ulid)}`, { method: 'PUT', body: JSON.stringify(body) }),
  remove: (ulid: string) =>
    adminFetchClient<unknown>(`/quizzes/${id(ulid)}`, { method: 'DELETE' }),

  createQuestion: (quizUlid: string, body: Record<string, unknown>) =>
    adminFetchClient<unknown>(`/quizzes/${id(quizUlid)}/questions`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateQuestion: (quizUlid: string, questionId: string | number, body: Record<string, unknown>) =>
    adminFetchClient<unknown>(`/quizzes/${id(quizUlid)}/questions/${id(questionId)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  deleteQuestion: (quizUlid: string, questionId: string | number) =>
    adminFetchClient<unknown>(`/quizzes/${id(quizUlid)}/questions/${id(questionId)}`, {
      method: 'DELETE',
    }),

  createAnswer: (questionId: string | number, body: Record<string, unknown>) =>
    adminFetchClient<unknown>(`/questions/${id(questionId)}/answers`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateAnswer: (
    questionId: string | number,
    answerId: string | number,
    body: Record<string, unknown>,
  ) =>
    adminFetchClient<unknown>(`/questions/${id(questionId)}/answers/${id(answerId)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  deleteAnswer: (questionId: string | number, answerId: string | number) =>
    adminFetchClient<unknown>(`/questions/${id(questionId)}/answers/${id(answerId)}`, {
      method: 'DELETE',
    }),

  createArchetype: (quizUlid: string, body: Record<string, unknown>) =>
    adminFetchClient<unknown>(`/quizzes/${id(quizUlid)}/archetypes`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateArchetype: (
    quizUlid: string,
    archetypeId: string | number,
    body: Record<string, unknown>,
  ) =>
    adminFetchClient<unknown>(`/quizzes/${id(quizUlid)}/archetypes/${id(archetypeId)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  deleteArchetype: (quizUlid: string, archetypeId: string | number) =>
    adminFetchClient<unknown>(`/quizzes/${id(quizUlid)}/archetypes/${id(archetypeId)}`, {
      method: 'DELETE',
    }),

  attachArchetypeProduct: (
    archetypeId: string | number,
    body: { product_ulid: string; sort_order?: number | null },
  ) =>
    adminFetchClient<unknown>(`/archetypes/${id(archetypeId)}/products`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  detachArchetypeProduct: (archetypeId: string | number, productUlid: string) =>
    adminFetchClient<unknown>(`/archetypes/${id(archetypeId)}/products/${id(productUlid)}`, {
      method: 'DELETE',
    }),
}

// ── AI tools ────────────────────────────────────────────────────────────────

export const adminAiToolApi = {
  createField: (toolUlid: string, body: Record<string, unknown>) =>
    adminFetchClient<unknown>(`/ai-tools/${id(toolUlid)}/fields`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateField: (toolUlid: string, fieldUlid: string, body: Record<string, unknown>) =>
    adminFetchClient<unknown>(`/ai-tools/${id(toolUlid)}/fields/${id(fieldUlid)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  deleteField: (toolUlid: string, fieldUlid: string) =>
    adminFetchClient<null>(`/ai-tools/${id(toolUlid)}/fields/${id(fieldUlid)}`, {
      method: 'DELETE',
    }),
  createOption: (toolUlid: string, fieldUlid: string, body: Record<string, unknown>) =>
    adminFetchClient<unknown>(`/ai-tools/${id(toolUlid)}/fields/${id(fieldUlid)}/options`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateOption: (
    toolUlid: string,
    fieldUlid: string,
    optionUlid: string,
    body: Record<string, unknown>,
  ) =>
    adminFetchClient<unknown>(
      `/ai-tools/${id(toolUlid)}/fields/${id(fieldUlid)}/options/${id(optionUlid)}`,
      { method: 'PUT', body: JSON.stringify(body) },
    ),
  deleteOption: (toolUlid: string, fieldUlid: string, optionUlid: string) =>
    adminFetchClient<null>(
      `/ai-tools/${id(toolUlid)}/fields/${id(fieldUlid)}/options/${id(optionUlid)}`,
      { method: 'DELETE' },
    ),
  runs: (toolUlid: string, query = '') =>
    adminFetchClient<unknown[]>(`/ai-tools/${id(toolUlid)}/runs${query}`),
}

// ── CRM ─────────────────────────────────────────────────────────────────────

export const adminCrmApi = {
  customers: (query = '') => adminFetchClient<unknown[]>(`/crm/customers${query}`),
  customer: (ulid: string) => adminFetchClient<unknown>(`/crm/customers/${id(ulid)}`),
  updateBuyerType: (ulid: string, buyer_type: 1 | 2 | 3 | 4) =>
    adminFetchClient<null>(`/crm/customers/${id(ulid)}/buyer-type`, {
      method: 'PUT',
      body: JSON.stringify({ buyer_type }),
    }),
  events: (ulid: string, query = '') =>
    adminFetchClient<unknown[]>(`/crm/customers/${id(ulid)}/events${query}`),
  adjustScore: (ulid: string, body: { delta: number; reason: string }) =>
    adminFetchClient<unknown>(`/crm/customers/${id(ulid)}/score`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  addTag: (ulid: string, tag: string) =>
    adminFetchClient<unknown>(`/crm/customers/${id(ulid)}/tags`, {
      method: 'POST',
      body: JSON.stringify({ tag }),
    }),
  removeTag: (ulid: string, tag: string) =>
    adminFetchClient<null>(`/crm/customers/${id(ulid)}/tags/${id(tag)}`, { method: 'DELETE' }),
}

// ── Email ───────────────────────────────────────────────────────────────────

export const adminEmailApi = {
  listSequences: (query = '') => adminFetchClient<unknown[]>(`/email/sequences${query}`),
  getSequence: (ulid: string) => adminFetchClient<unknown>(`/email/sequences/${id(ulid)}`),
  createSequence: (body: Record<string, unknown>) =>
    adminFetchClient<unknown>('/email/sequences', { method: 'POST', body: JSON.stringify(body) }),
  updateSequence: (ulid: string, body: Record<string, unknown>) =>
    adminFetchClient<unknown>(`/email/sequences/${id(ulid)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  deleteSequence: (ulid: string) =>
    adminFetchClient<null>(`/email/sequences/${id(ulid)}`, { method: 'DELETE' }),

  createStep: (ulid: string, body: Record<string, unknown>) =>
    adminFetchClient<unknown>(`/email/sequences/${id(ulid)}/steps`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateStep: (ulid: string, stepId: string | number, body: Record<string, unknown>) =>
    adminFetchClient<unknown>(`/email/sequences/${id(ulid)}/steps/${id(stepId)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  deleteStep: (ulid: string, stepId: string | number) =>
    adminFetchClient<null>(`/email/sequences/${id(ulid)}/steps/${id(stepId)}`, {
      method: 'DELETE',
    }),

  enrollments: (sequenceUlid: string, query = '') =>
    adminFetchClient<unknown[]>(`/email/sequences/${id(sequenceUlid)}/enrollments${query}`),
  unsubscribeEnrollment: (enrollmentId: string | number) =>
    adminFetchClient<null>(`/email/enrollments/${id(enrollmentId)}/unsubscribe`, {
      method: 'POST',
    }),

  suppressions: (query = '') => adminFetchClient<unknown[]>(`/email/suppressions${query}`),
  addSuppression: (email: string) =>
    adminFetchClient<unknown>('/email/suppressions', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  deleteSuppression: (suppressionId: string | number) =>
    adminFetchClient<null>(`/email/suppressions/${id(suppressionId)}`, { method: 'DELETE' }),
}

// ── Automation rules ────────────────────────────────────────────────────────

export const adminAutomationApi = {
  list: (query = '') => adminFetchClient<unknown[]>(`/automation-rules${query}`),
  get: (ulid: string) => adminFetchClient<unknown>(`/automation-rules/${id(ulid)}`),
  create: (body: Record<string, unknown>) =>
    adminFetchClient<unknown>('/automation-rules', { method: 'POST', body: JSON.stringify(body) }),
  update: (ulid: string, body: Record<string, unknown>) =>
    adminFetchClient<unknown>(`/automation-rules/${id(ulid)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  remove: (ulid: string) =>
    adminFetchClient<null>(`/automation-rules/${id(ulid)}`, { method: 'DELETE' }),
  toggle: (ulid: string, active: boolean) =>
    adminFetchClient<unknown>(`/automation-rules/${id(ulid)}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    }),
}

// ── Analytics ───────────────────────────────────────────────────────────────

export interface AnalyticsReportParams {
  date_from: string
  date_to: string
  filter_brand_id?: number
  product_id?: number
  funnel_id?: number
  group_by?: 'daily' | 'weekly' | 'monthly'
  per_page?: number
  cursor?: string | null
}

function analyticsQuery(params: AnalyticsReportParams): string {
  const query = new URLSearchParams()
  query.set('date_from', params.date_from)
  query.set('date_to', params.date_to)
  if (params.filter_brand_id) query.set('filter_brand_id', String(params.filter_brand_id))
  if (params.product_id) query.set('product_id', String(params.product_id))
  if (params.funnel_id) query.set('funnel_id', String(params.funnel_id))
  if (params.group_by) query.set('group_by', params.group_by)
  if (params.per_page) query.set('per_page', String(params.per_page))
  if (params.cursor) query.set('cursor', params.cursor)
  return query.toString()
}

export const adminAnalyticsApi = {
  revenue: (params: AnalyticsReportParams) =>
    adminFetchClient<unknown>(`/analytics/revenue?${analyticsQuery(params)}`),
  productPerformance: (params: AnalyticsReportParams) =>
    adminFetchClient<unknown[]>(`/analytics/product-performance?${analyticsQuery(params)}`),
  funnelPerformance: (params: AnalyticsReportParams) =>
    adminFetchClient<unknown[]>(`/analytics/funnel-performance?${analyticsQuery(params)}`),
}
