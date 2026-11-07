import type { LocalizedValue } from '@/shared/types/builder'

export interface StorefrontSectionCatalogItem {
  type: string
  label: LocalizedValue
  description: LocalizedValue
}

// Keep these identifiers stable: the storefront renderer consumes the same values.
export const storefrontSectionCatalog: StorefrontSectionCatalogItem[] = [
  { type: 'header', label: { ar: 'رأس الصفحة', en: 'Header' }, description: { ar: 'شعار وروابط المتجر', en: 'Store logo and navigation' } },
  { type: 'announcement', label: { ar: 'شريط إعلان', en: 'Announcement bar' }, description: { ar: 'رسالة قصيرة أعلى الصفحة', en: 'A short message above the page' } },
  { type: 'hero', label: { ar: 'واجهة رئيسية', en: 'Hero' }, description: { ar: 'عنوان ورسالة رئيسية', en: 'Primary headline and message' } },
  { type: 'product_grid', label: { ar: 'شبكة المنتجات', en: 'Product grid' }, description: { ar: 'عرض المنتجات في شبكة', en: 'Products in a responsive grid' } },
  { type: 'product_detail', label: { ar: 'تفاصيل المنتج', en: 'Product detail' }, description: { ar: 'صورة ومعلومات المنتج', en: 'Product image and information' } },
  { type: 'image_text', label: { ar: 'صورة ونص', en: 'Image and text' }, description: { ar: 'قسم بصري مع نص', en: 'Visual content with supporting text' } },
  { type: 'rich_text', label: { ar: 'نص منسق', en: 'Rich text' }, description: { ar: 'محتوى نصي طويل', en: 'Long-form text content' } },
  { type: 'faq', label: { ar: 'الأسئلة الشائعة', en: 'FAQ' }, description: { ar: 'أسئلة وأجوبة قابلة للفتح', en: 'Expandable questions and answers' } },
  { type: 'testimonials', label: { ar: 'آراء العملاء', en: 'Testimonials' }, description: { ar: 'شهادات وتجارب العملاء', en: 'Customer testimonials' } },
  { type: 'cta', label: { ar: 'دعوة لاتخاذ إجراء', en: 'Call to action' }, description: { ar: 'زر ورسالة تحويل', en: 'Conversion-focused message and button' } },
  { type: 'category_grid', label: { ar: 'تصنيفات المنتجات', en: 'Category grid' }, description: { ar: 'عرض التصنيفات بصريًا', en: 'Visual category navigation' } },
  { type: 'product_carousel', label: { ar: 'شريط المنتجات', en: 'Product carousel' }, description: { ar: 'منتجات أفقية قابلة للتمرير', en: 'Horizontal product showcase' } },
  { type: 'video', label: { ar: 'فيديو', en: 'Video' }, description: { ar: 'فيديو ترويجي', en: 'Promotional video block' } },
  { type: 'stats', label: { ar: 'إحصائيات', en: 'Stats' }, description: { ar: 'أرقام ومؤشرات ثقة', en: 'Trust-building metrics' } },
  { type: 'logo_cloud', label: { ar: 'شعارات العملاء', en: 'Logo cloud' }, description: { ar: 'شعارات العملاء والشركاء', en: 'Customer and partner logos' } },
  { type: 'newsletter', label: { ar: 'النشرة البريدية', en: 'Newsletter' }, description: { ar: 'جمع البريد الإلكتروني', en: 'Email capture block' } },
  { type: 'spacer', label: { ar: 'مسافة', en: 'Spacer' }, description: { ar: 'مسافة قابلة للتخصيص', en: 'Customizable vertical space' } },
  { type: 'footer', label: { ar: 'تذييل الصفحة', en: 'Footer' }, description: { ar: 'روابط وحقوق النشر', en: 'Footer links and copyright' } },
]

