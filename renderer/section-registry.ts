import type { ComponentType } from 'react'
import type { Locale, SectionInstance } from '@/shared/types/builder'
import { FaqSection } from './sections/FaqSection'
import { FooterSection } from './sections/FooterSection'
import { HeaderSection } from './sections/HeaderSection'
import { HeroSection } from './sections/HeroSection'
import { ImageTextSection } from './sections/ImageTextSection'
import { ProductGridSection } from './sections/ProductGridSection'
import { RichTextSection } from './sections/RichTextSection'
import { AnnouncementSection } from './sections/AnnouncementSection'
import { CtaSection } from './sections/CtaSection'
import { ProductDetailSection } from './sections/ProductDetailSection'
import { TestimonialsSection } from './sections/TestimonialsSection'
import { CategoryGridSection } from './sections/CategoryGridSection'
import { ProductCarouselSection } from './sections/ProductCarouselSection'
import { VideoSection } from './sections/VideoSection'
import { StatsSection } from './sections/StatsSection'
import { LogoCloudSection } from './sections/LogoCloudSection'
import { NewsletterSection } from './sections/NewsletterSection'
import { SpacerSection } from './sections/SpacerSection'
import { SectionFallback } from './SectionFallback'

export interface SectionComponentProps { section: SectionInstance; locale: Locale }
export const sectionRegistry: Record<string, ComponentType<SectionComponentProps>> = {
  hero: HeroSection,
  product_grid: ProductGridSection,
  product_details: ProductDetailSection,
  product_catalog: ProductGridSection,
  faq: FaqSection,
  rich_text: RichTextSection,
  image_text: ImageTextSection,
  header: HeaderSection,
  footer: FooterSection,
  announcement: AnnouncementSection,
  product_detail: ProductDetailSection,
  testimonials: TestimonialsSection,
  cta: CtaSection,
  category_grid: CategoryGridSection,
  product_carousel: ProductCarouselSection,
  video: VideoSection,
  stats: StatsSection,
  logo_cloud: LogoCloudSection,
  newsletter: NewsletterSection,
  spacer: SpacerSection,
}

export function getSectionComponent(type: string): ComponentType<SectionComponentProps> {
  return sectionRegistry[type] ?? SectionFallback
}
