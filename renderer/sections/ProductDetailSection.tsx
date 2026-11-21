import type { Locale, SectionInstance } from '@/shared/types/builder'
import { resolveMediaUrl } from '@/shared/lib/media-url'
import { editKey, settingText, settingString } from '../section-utils'

export function ProductDetailSection({ section, locale }: { section: SectionInstance; locale: Locale }) {
  const imageKey = 'image_url' in section.settings ? 'image_url' : 'image'
  const image = resolveMediaUrl(settingString(section.settings, imageKey))
  const title = settingText(section.settings, 'title', locale, locale === 'ar' ? 'اسم المنتج' : 'Product name')
  const description = settingText(section.settings, 'description', locale, locale === 'ar' ? 'وصف المنتج' : 'Product description')
  const price = settingString(section.settings, 'price', locale === 'ar' ? 'السعر' : 'Price')
  const buttonLabel = settingText(section.settings, 'button_label', locale, locale === 'ar' ? 'أضف إلى السلة' : 'Add to cart')
  return (
    <section className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-2 md:items-center">
      <div
        {...editKey(imageKey)}
        className="aspect-square overflow-hidden rounded-2xl bg-muted"
        style={image ? { backgroundImage: `url("${image}")`, backgroundPosition: 'center', backgroundSize: 'cover' } : undefined}
      />
      <div>
        <h2 {...editKey('title')} className="text-3xl font-semibold">{title}</h2>
        <p {...editKey('description')} className="mt-4 text-muted-foreground">{description}</p>
        <div {...editKey('price')} className="mt-6 text-2xl font-semibold">{price}</div>
        <span {...editKey('button_label')} className="mt-6 inline-flex rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">
          {buttonLabel}
        </span>
      </div>
    </section>
  )
}
