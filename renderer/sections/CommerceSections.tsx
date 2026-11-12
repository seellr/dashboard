import type { Locale, SectionInstance } from '@/shared/types/builder'
import { settingText } from '../section-utils'
import { RichTextContent } from '../RichTextContent'

/**
 * Renderers for the section types defined by the live `default` theme schema
 * that have no dedicated design yet. They use the same settings keys the
 * schema exposes so live payloads render instead of the unsupported fallback.
 */

export function FeaturedProductSection({ section, locale }: { section: SectionInstance; locale: Locale }) {
  const cta = settingText(section.settings, 'cta_label', locale, locale === 'ar' ? 'اشتري الآن' : 'Buy now')
  const product = typeof section.settings.product === 'string' ? section.settings.product : ''
  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <div className="grid gap-8 rounded-3xl border bg-card p-8 md:grid-cols-2 md:items-center">
        <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 via-muted to-secondary" />
        <div className="space-y-4">
          <div className="h-4 w-24 rounded bg-muted" />
          <h2 className="text-2xl font-bold tracking-tight">
            {product ? `${locale === 'ar' ? 'منتج' : 'Product'} ${product.slice(-6)}` : locale === 'ar' ? 'منتج مميز' : 'Featured product'}
          </h2>
          <div className="h-3 w-2/3 rounded bg-muted" />
          <span className="inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">
            {cta}
          </span>
        </div>
      </div>
    </section>
  )
}

export function CartItemsSection({ section, locale }: { section: SectionInstance; locale: Locale }) {
  const message = settingText(section.settings, 'empty_message', locale)
  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">
        {message || (locale === 'ar' ? 'سلتك فارغة' : 'Your cart is empty')}
      </div>
    </section>
  )
}

export function AccountDashboardSection({ section, locale }: { section: SectionInstance; locale: Locale }) {
  const welcome = settingText(section.settings, 'welcome', locale)
  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <h2 className="text-2xl font-bold tracking-tight">
        {welcome || (locale === 'ar' ? 'أهلا بك' : 'Welcome back')}
      </h2>
    </section>
  )
}

export function OfferHeroSection({ section, locale }: { section: SectionInstance; locale: Locale }) {
  const accept = settingText(section.settings, 'accept_label', locale, locale === 'ar' ? 'نعم، أضف العرض' : 'Yes, add this offer')
  const decline = settingText(section.settings, 'decline_label', locale, locale === 'ar' ? 'لا شكرا' : 'No thanks')
  const showPrice = section.settings.show_price !== false
  return (
    <section className="mx-auto max-w-3xl px-6 py-16 text-center">
      <div className="rounded-3xl border bg-card p-10">
        <h2 className="text-3xl font-bold tracking-tight">{locale === 'ar' ? 'عرض خاص' : 'Special offer'}</h2>
        {showPrice && <p className="mt-4 text-lg font-semibold text-primary">{locale === 'ar' ? 'السعر' : 'Price'}</p>}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <span className="inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">{accept}</span>
          <span className="inline-flex rounded-full border px-6 py-3 text-sm font-semibold">{decline}</span>
        </div>
      </div>
    </section>
  )
}

export function CountdownSection({ section, locale }: { section: SectionInstance; locale: Locale }) {
  const label = settingText(section.settings, 'label', locale)
  const color = typeof section.settings.color === 'string' ? section.settings.color : '#D32F2F'
  return (
    <section className="mx-auto max-w-3xl px-6 py-12 text-center">
      <p className="text-sm font-medium uppercase tracking-[0.2em]" style={{ color }}>
        {label || (locale === 'ar' ? 'ينتهي العرض خلال' : 'Offer ends in')}
      </p>
      <div className="mt-4 flex justify-center gap-3">
        {['00', '00', '00'].map((value, index) => (
          <span key={index} className="rounded-xl border bg-card px-5 py-3 text-2xl font-bold tabular-nums">
            {value}
          </span>
        ))}
      </div>
    </section>
  )
}

export function ThankYouMessageSection({ section, locale }: { section: SectionInstance; locale: Locale }) {
  const heading = settingText(section.settings, 'heading', locale, locale === 'ar' ? 'شكرا لطلبك' : 'Thank you for your order')
  const message = settingText(section.settings, 'message', locale)
  return (
    <section className="mx-auto max-w-3xl px-6 py-20 text-center">
      <h2 className="text-3xl font-bold tracking-tight">{heading}</h2>
      {message && <RichTextContent html={message} className="theme-rich-text mt-6 text-start" />}
    </section>
  )
}

export function NotFoundMessageSection({ section, locale }: { section: SectionInstance; locale: Locale }) {
  const heading = settingText(section.settings, 'heading', locale, locale === 'ar' ? 'الصفحة غير موجودة' : 'Page not found')
  return (
    <section className="mx-auto max-w-3xl px-6 py-24 text-center">
      <h2 className="text-4xl font-bold tracking-tight">{heading}</h2>
    </section>
  )
}
