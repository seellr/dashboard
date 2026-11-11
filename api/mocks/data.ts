import type { BuilderPage, ThemeSchema, ThemeSummary } from '@/shared/types/builder'

export const sampleThemes: ThemeSummary[] = [
  {
    ulid: '01JTHEME000000000000000001',
    slug: 'modern-store',
    status: { id: 2, label: 'Published' },
    name: 'Modern Store',
    description: 'A clean storefront theme',
    preview_url: '/theme-previews/modern-store.png',
    version: '1.0.0',
    has_manifest: true,
    settings: [],
    created_at: '2026-01-01T00:00:00Z',
  },
]

export const sampleSchema: ThemeSchema = {
  theme: {
    ulid: '01JTHEME000000000000000001',
    handle: 'modern-store',
    version: '1.0.0',
    name: 'Modern Store',
  },
  fonts: ['Cairo', 'Tajawal', 'Inter'],
  locales: ['ar', 'en'],
  settings: [
    {
      key: 'primary_color',
      type: 'color',
      label: 'Primary color',
      default: '#111111',
      translatable: false,
      required: false,
      options: [],
    },
  ],
  sections: [
    {
      handle: 'hero',
      name: 'Hero',
      max_blocks: 3,
      limit_per_page: null,
      page_types: ['home', 'custom'],
      settings: [
        {
          key: 'heading',
          type: 'text',
          label: 'Heading',
          default: { ar: 'مرحبا بك في متجرنا', en: 'Welcome to our store' },
          translatable: true,
          required: true,
          options: [],
        },
        {
          key: 'subheading',
          type: 'textarea',
          label: 'Subheading',
          default: null,
          translatable: true,
          required: false,
          options: [],
        },
        {
          key: 'primary_color',
          type: 'color',
          label: 'Background color',
          default: '#111827',
          translatable: false,
          required: false,
          options: [],
        },
      ],
      blocks: [],
    },
    {
      handle: 'rich_text',
      name: 'Rich text',
      max_blocks: null,
      limit_per_page: null,
      page_types: ['home', 'custom'],
      settings: [
        {
          key: 'content',
          type: 'richtext',
          label: 'Content',
          default: { ar: '<p>اكتب المحتوى هنا</p>', en: '<p>Write your content here</p>' },
          translatable: true,
          required: false,
          options: [],
        },
      ],
      blocks: [],
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
      settings: { heading: { ar: 'أهلاً بك', en: 'Welcome' }, primary_color: '#111827' },
    },
  ],
}
