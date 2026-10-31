import type { BuilderPage, ThemeSchema, ThemeSummary } from '@/shared/types/builder'

export const sampleThemes: ThemeSummary[] = [
  {
    ulid: '01JTHEME000000000000000001',
    slug: 'modern-store',
    status: { id: 1, label: 'published' },
    name: { ar: 'المتجر العصري', en: 'Modern Store' },
    description: { ar: 'قالب نظيف للمتاجر', en: 'A clean storefront theme' },
    preview_url: '/theme-previews/modern-store.png',
    settings: [],
    created_at: '2026-01-01T00:00:00Z',
  },
]

export const sampleSchema: ThemeSchema = {
  sections: [
    {
      type: 'hero',
      label: { ar: 'واجهة رئيسية', en: 'Hero' },
      settings: [
        { key: 'title', label: { ar: 'العنوان', en: 'Title' }, type: 'text', translatable: true },
        { key: 'background_color', label: { ar: 'لون الخلفية', en: 'Background color' }, type: 'color', default_value: '#111827' },
      ],
    },
  ],
}

export const samplePage: BuilderPage = {
  ulid: '01JPAGE000000000000000001',
  type: 'home',
  name: { ar: 'الرئيسية', en: 'Home' },
  sections: [
    {
      id: 'section-hero-1',
      type: 'hero',
      settings: { title: { ar: 'أهلاً بك', en: 'Welcome' }, background_color: '#111827' },
    },
  ],
}
