import type { ComponentType } from 'react'
import type { Locale, SectionInstance } from '@/shared/types/builder'
import { FaqSection } from './sections/FaqSection'
import { FooterSection } from './sections/FooterSection'
import { HeaderSection } from './sections/HeaderSection'
import { HeroSection } from './sections/HeroSection'
import { ImageTextSection } from './sections/ImageTextSection'
import { ProductGridSection } from './sections/ProductGridSection'
import { RichTextSection } from './sections/RichTextSection'
import { SectionFallback } from './SectionFallback'

export interface SectionComponentProps { section: SectionInstance; locale: Locale }
export const sectionRegistry: Record<string, ComponentType<SectionComponentProps>> = {
  hero: HeroSection,
  product_grid: ProductGridSection,
  faq: FaqSection,
  rich_text: RichTextSection,
  image_text: ImageTextSection,
  header: HeaderSection,
  footer: FooterSection,
}

export function getSectionComponent(type: string): ComponentType<SectionComponentProps> {
  return sectionRegistry[type] ?? SectionFallback
}
