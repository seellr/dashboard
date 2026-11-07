import type { Locale, SectionInstance } from '@/shared/types/builder'
import { settingText, settingString } from '../section-utils'

export function ProductDetailSection({ section, locale }: { section: SectionInstance; locale: Locale }) {
  const image = settingString(section.settings, 'image_url')
  return <section className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-2 md:items-center"><div className="aspect-square overflow-hidden rounded-2xl bg-muted" style={image ? { backgroundImage: `url(${image})`, backgroundPosition: 'center', backgroundSize: 'cover' } : undefined} /><div><h2 className="text-3xl font-semibold">{settingText(section.settings, 'title', locale, locale === 'ar' ? 'اسم المنتج' : 'Product name')}</h2><p className="mt-4 text-muted-foreground">{settingText(section.settings, 'description', locale, locale === 'ar' ? 'وصف المنتج' : 'Product description')}</p><div className="mt-6 text-2xl font-semibold">{settingString(section.settings, 'price', locale === 'ar' ? 'السعر' : 'Price')}</div><span className="mt-6 inline-flex rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">{locale === 'ar' ? 'أضف إلى السلة' : 'Add to cart'}</span></div></section>
}
