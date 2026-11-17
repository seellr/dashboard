import type {
  SectionDefinition,
  SettingDefinition,
  ThemeSchema,
} from '@/shared/types/builder'

const HERO_IMAGE_KEYS = [
  'image',
  'image_url',
  'background_image',
  'background_image_url',
  'hero_image',
  'hero_image_url',
  'banner_image',
  'banner_image_url',
]

const HEADER_LOGO_KEYS = [
  'logo',
  'logo_url',
  'logo_image',
  'logo_image_url',
  'header_logo',
  'header_logo_url',
  'brand_logo',
]

const heroImageSetting: SettingDefinition = {
  key: 'image',
  type: 'image',
  label: 'Hero image',
  help: 'Image shown behind the hero heading and buttons.',
  default: null,
  translatable: false,
  required: false,
}

const headerLogoSetting: SettingDefinition = {
  key: 'logo',
  type: 'image',
  label: 'Logo',
  help: 'Shown next to your store name in the header.',
  default: null,
  translatable: false,
  required: false,
}

/**
 * The live theme schema does not always expose the hero image or the header
 * logo, and some manifests return them as plain text/url settings. Both cases
 * left sellers without a media picker, so make sure the section always has an
 * `image` setting the builder can render and the renderer knows how to read.
 */
function ensureImageSetting(
  section: SectionDefinition,
  keys: string[],
  fallback: SettingDefinition,
): SectionDefinition {
  const existing = section.settings.find((setting) => keys.includes(setting.key))
  if (!existing) {
    return { ...section, settings: [...section.settings, fallback] }
  }
  if (existing.type === 'image') return section
  return {
    ...section,
    settings: section.settings.map((setting) =>
      setting.key === existing.key ? { ...setting, type: 'image' } : setting,
    ),
  }
}

export const productCarouselFallback: SectionDefinition = {
  handle: 'product_carousel',
  name: 'Product carousel',
  max_blocks: null,
  limit_per_page: null,
  page_types: ['home', 'product_list', 'custom'],
  settings: [
    {
      key: 'heading',
      type: 'text',
      label: 'Heading',
      default: { ar: 'الأكثر طلبًا', en: 'Popular right now' },
      translatable: true,
      required: false,
    },
    {
      key: 'subheading',
      type: 'textarea',
      label: 'Subheading',
      default: null,
      translatable: true,
      required: false,
    },
    {
      key: 'products',
      type: 'product_list',
      label: 'Products',
      default: [],
      translatable: false,
      required: false,
    },
    {
      key: 'slides_per_view',
      type: 'select',
      label: 'Slides per view',
      default: '4',
      translatable: false,
      required: false,
      options: [
        { value: '1', label: '1' },
        { value: '2', label: '2' },
        { value: '3', label: '3' },
        { value: '4', label: '4' },
      ],
    },
    {
      key: 'loop',
      type: 'toggle',
      label: 'Loop',
      default: true,
      translatable: false,
      required: false,
    },
    {
      key: 'autoplay',
      type: 'toggle',
      label: 'Autoplay',
      default: false,
      translatable: false,
      required: false,
    },
    {
      key: 'show_arrows',
      type: 'toggle',
      label: 'Show arrows',
      default: true,
      translatable: false,
      required: false,
    },
    {
      key: 'show_dots',
      type: 'toggle',
      label: 'Show dots',
      default: false,
      translatable: false,
      required: false,
    },
  ],
  blocks: [],
}

/**
 * Adds the editable settings the storefront renderer supports but the remote
 * schema may omit. This keeps the carousel available in the dashboard section
 * picker and gives hero/header sections working image pickers.
 */
export function withStorefrontSectionFallbacks(schema: ThemeSchema): ThemeSchema {
  // When the API returns no sections the builder already uses the local
  // catalog, which includes the carousel definition.
  if (schema.sections.length === 0) return schema

  const sections = schema.sections.map((section) => {
    if (section.handle === 'hero') {
      return ensureImageSetting(section, HERO_IMAGE_KEYS, heroImageSetting)
    }
    if (section.handle === 'header') {
      return ensureImageSetting(section, HEADER_LOGO_KEYS, headerLogoSetting)
    }
    return section
  })

  if (!sections.some((section) => section.handle === 'product_carousel')) {
    sections.push(productCarouselFallback)
  }

  return { ...schema, sections }
}
