import type { Meta, StoryObj } from '@storybook/react'
import { FaqSection } from '@/renderer/sections/FaqSection'
import { FooterSection } from '@/renderer/sections/FooterSection'
import { HeaderSection } from '@/renderer/sections/HeaderSection'
import { HeroSection } from '@/renderer/sections/HeroSection'
import { ImageTextSection } from '@/renderer/sections/ImageTextSection'
import { ProductGridSection } from '@/renderer/sections/ProductGridSection'
import { RichTextSection } from '@/renderer/sections/RichTextSection'
import type { SectionInstance } from '@/shared/types/builder'

const meta = { title: 'Renderer/Sections', parameters: { layout: 'fullscreen' } } satisfies Meta
export default meta
type Story = StoryObj<typeof meta>

const section = (type: string, settings: SectionInstance['settings'] = {}, blocks?: SectionInstance['blocks']): SectionInstance => ({ id: `story-${type}`, type, settings, blocks })

export const Hero: Story = { render: () => <HeroSection locale="en" section={section('hero', { title: { ar: 'مرحبًا', en: 'Welcome' }, subtitle: { ar: 'ابدأ الآن', en: 'Start building today' }, background_color: '#2563eb' })} /> }
export const ProductGrid: Story = { render: () => <ProductGridSection locale="en" section={section('product_grid', { title: { ar: 'المنتجات', en: 'Featured products' }, count: '3' })} /> }
export const Faq: Story = { render: () => <FaqSection locale="en" section={section('faq', { title: { ar: 'الأسئلة', en: 'FAQs' } }, [{ id: 'one', type: 'faq', settings: { question: { ar: 'ما هذا؟', en: 'What is this?' }, answer: { ar: 'إجابة', en: 'An answer' } } }])} /> }
export const RichText: Story = { render: () => <RichTextSection locale="en" section={section('rich_text', { content: { ar: 'محتوى', en: 'Rich text content' } })} /> }
export const ImageText: Story = { render: () => <ImageTextSection locale="en" section={section('image_text', { title: { ar: 'عنوان', en: 'Image and text' }, body: { ar: 'نص', en: 'Supporting copy' } })} /> }
export const Header: Story = { render: () => <HeaderSection locale="en" section={section('header', { label: { ar: 'متجري', en: 'My store' } })} /> }
export const Footer: Story = { render: () => <FooterSection locale="en" section={section('footer', { label: { ar: 'حقوق النشر', en: 'All rights reserved' } })} /> }
