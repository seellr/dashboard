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

/**
 * The storefront renderers support more editable copy than some theme
 * manifests expose. Without a setting definition the builder cannot render an
 * input for it, so a click on that text in the preview would have nowhere to
 * go. These definitions are merged into the schema (only for keys the manifest
 * does not already define).
 */
function localizedSetting(
  key: string,
  label: string,
  ar: string,
  en: string,
  type: 'text' | 'textarea' | 'richtext' = 'text',
): SettingDefinition {
  return {
    key,
    type,
    label,
    default: { ar, en },
    translatable: true,
    required: false,
  }
}

function plainSetting(
  key: string,
  label: string,
  defaultValue: string,
  type: 'text' | 'url' = 'text',
): SettingDefinition {
  return {
    key,
    type,
    label,
    default: defaultValue,
    translatable: false,
    required: false,
  }
}

const SECTION_SETTING_FALLBACKS: Record<string, SettingDefinition[]> = {
  hero: [
    localizedSetting('eyebrow', 'Eyebrow', 'اختيارات مصممة لك', 'Curated for you'),
  ],
  header: [
    localizedSetting('label', 'Store name', 'متجري', 'My store'),
  ],
  announcement: [
    localizedSetting('message', 'Message', 'شحن مجاني لفترة محدودة', 'Free shipping for a limited time'),
    localizedSetting('link_label', 'Link label', 'تسوق الآن', 'Shop now'),
    plainSetting('link_href', 'Link URL', '#products', 'url'),
  ],
  cta: [
    localizedSetting('title', 'Title', 'ابدأ الآن', 'Get started today'),
    localizedSetting('body', 'Body', '', '', 'textarea'),
    localizedSetting('button_label', 'Button label', 'تسوق الآن', 'Shop now'),
  ],
  footer: [
    localizedSetting('copyright', 'Copyright', 'جميع الحقوق محفوظة', 'All rights reserved'),
  ],
  image_text: [
    localizedSetting('title', 'Title', 'صورة ونص', 'Image and text'),
    localizedSetting('body', 'Body', '', '', 'textarea'),
  ],
  newsletter: [
    localizedSetting('title', 'Title', 'اشترك في النشرة', 'Join our newsletter'),
    localizedSetting('body', 'Body', 'احصل على آخر الأخبار والعروض.', 'Get the latest news and offers.', 'textarea'),
    localizedSetting('placeholder', 'Input placeholder', 'بريدك الإلكتروني', 'Your email address'),
    localizedSetting('button_label', 'Button label', 'اشترك', 'Subscribe'),
  ],
  stats: [
    plainSetting('value_1', 'Stat 1 value', '10K+'),
    plainSetting('value_2', 'Stat 2 value', '4.9/5'),
    plainSetting('value_3', 'Stat 3 value', '24/7'),
    localizedSetting('label_1', 'Stat 1 label', 'مؤشر ثقة 1', 'Trust metric 1'),
    localizedSetting('label_2', 'Stat 2 label', 'مؤشر ثقة 2', 'Trust metric 2'),
    localizedSetting('label_3', 'Stat 3 label', 'مؤشر ثقة 3', 'Trust metric 3'),
  ],
  logo_cloud: [
    localizedSetting('heading', 'Heading', 'يثق بنا عملاؤنا', 'Trusted by teams at'),
    ...['NOVA', 'MOTION', 'PULSE', 'ORBIT', 'LUMA'].map((name, index) =>
      plainSetting(`name_${index + 1}`, `Logo ${index + 1}`, name),
    ),
  ],
  category_grid: [
    localizedSetting('title', 'Title', 'تسوق حسب التصنيف', 'Shop by category'),
    ...Array.from({ length: 8 }, (_, index) =>
      localizedSetting(
        `category_${index + 1}`,
        `Category ${index + 1}`,
        `تصنيف ${index + 1}`,
        `Category ${index + 1}`,
      ),
    ),
  ],
  faq: [
    localizedSetting('heading', 'Heading', 'الأسئلة الشائعة', 'Frequently asked questions'),
  ],
  testimonials: [
    localizedSetting('heading', 'Heading', 'ماذا يقول عملاؤنا', 'What our customers say'),
  ],
  video: [
    localizedSetting('title', 'Title', 'شاهد قصتنا', 'Watch our story'),
  ],
  product_grid: [
    localizedSetting('eyebrow', 'Eyebrow', 'منتجات مختارة', 'Selected collection'),
    localizedSetting('badge', 'Product badge', 'مميز', 'Featured'),
  ],
  product_detail: [
    localizedSetting('title', 'Product name', 'اسم المنتج', 'Product name'),
    localizedSetting('description', 'Description', 'وصف المنتج', 'Product description', 'textarea'),
    localizedSetting('price', 'Price', 'السعر', 'Price'),
    localizedSetting('button_label', 'Button label', 'أضف إلى السلة', 'Add to cart'),
  ],
  product_carousel: [
    localizedSetting('eyebrow', 'Eyebrow', 'منتجات مختارة', 'Selected collection'),
  ],
  featured_product: [
    localizedSetting('title', 'Title', 'منتج مميز', 'Featured product'),
  ],
  cart_items: [
    localizedSetting('empty_message', 'Empty cart message', 'سلتك فارغة', 'Your cart is empty'),
  ],
  account_dashboard: [
    localizedSetting('welcome', 'Welcome message', 'أهلا بك', 'Welcome back'),
  ],
  offer_hero: [
    localizedSetting('heading', 'Heading', 'عرض خاص', 'Special offer'),
    localizedSetting('price_label', 'Price label', 'السعر', 'Price'),
  ],
  countdown: [
    localizedSetting('label', 'Label', 'ينتهي العرض خلال', 'Offer ends in'),
  ],
  thank_you_message: [
    localizedSetting('heading', 'Heading', 'شكرا لطلبك', 'Thank you for your order'),
    localizedSetting('message', 'Message', '', '', 'richtext'),
  ],
  not_found_message: [
    localizedSetting('heading', 'Heading', 'الصفحة غير موجودة', 'Page not found'),
  ],
  rich_text: [
    localizedSetting('heading', 'Heading', '', ''),
    localizedSetting('content', 'Content', '', '', 'richtext'),
  ],
}

function ensureSettings(
  section: SectionDefinition,
  fallbacks: SettingDefinition[],
): SectionDefinition {
  const missing = fallbacks.filter(
    (fallback) => !section.settings.some((setting) => setting.key === fallback.key),
  )
  if (missing.length === 0) return section
  return { ...section, settings: [...section.settings, ...missing] }
}

export const productCarouselFallback: SectionDefinition = {  handle: 'product_carousel',
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
      key: 'eyebrow',
      type: 'text',
      label: 'Eyebrow',
      default: { ar: 'منتجات مختارة', en: 'Selected collection' },
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
    const fallbacks = SECTION_SETTING_FALLBACKS[section.handle] ?? []
    let next = ensureSettings(section, fallbacks)
    if (next.handle === 'hero') {
      next = ensureImageSetting(next, HERO_IMAGE_KEYS, heroImageSetting)
    }
    if (next.handle === 'header') {
      next = ensureImageSetting(next, HEADER_LOGO_KEYS, headerLogoSetting)
    }
    if (next.handle === 'image_text' || next.handle === 'product_detail') {
      next = ensureImageSetting(next, ['image', 'image_url'], heroImageSetting)
    }
    return next
  })

  if (!sections.some((section) => section.handle === 'product_carousel')) {
    sections.push(productCarouselFallback)
  }

  return { ...schema, sections }
}
