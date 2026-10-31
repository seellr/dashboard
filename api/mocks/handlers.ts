import { http, HttpResponse } from 'msw'
import { samplePage, sampleSchema, sampleThemes } from './data'

const api = '*/api/subscriber'

export const builderHandlers = [
  http.get(`${api}/themes`, () => HttpResponse.json({ success: true, data: sampleThemes, meta: { has_more: false, next_cursor: null } })),
  http.get(`${api}/theme`, () => HttpResponse.json({ success: true, data: { theme_ulid: sampleThemes[0].ulid, theme_name: sampleThemes[0].name, activated_at: '2026-01-01T00:00:00Z', settings: [] } })),
  http.get(`${api}/theme/schema`, () => HttpResponse.json({ success: true, data: sampleSchema })),
  http.get(`${api}/pages/home/draft`, () => HttpResponse.json({ success: true, data: samplePage })),
]
