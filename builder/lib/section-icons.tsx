import {
  AlertCircle,
  Award,
  BarChart3,
  CheckCircle2,
  Gift,
  Grid2X2,
  HelpCircle,
  ImageIcon,
  LayoutTemplate,
  Mail,
  Megaphone,
  MessageSquare,
  Minus,
  MousePointerClick,
  Package,
  PanelBottom,
  Play,
  ShoppingBag,
  ShoppingCart,
  Timer,
  Type,
  UserRound,
} from 'lucide-react'

interface SectionIconProps {
  type: string
  className?: string
}

/**
 * Small, recognizable icons for the section picker and the settings header.
 * Each icon is returned explicitly so bundlers can tree-shake unused ones and
 * React keeps a stable component type across renders.
 */
export function SectionIcon({ type, className }: SectionIconProps) {
  switch (type) {
    case 'announcement':
      return <Megaphone className={className} aria-hidden="true" />
    case 'product_list':
      return <ShoppingBag className={className} aria-hidden="true" />
    case 'product_detail':
    case 'product_details':
      return <Package className={className} aria-hidden="true" />
    case 'featured_product':
      return <Gift className={className} aria-hidden="true" />
    case 'product_carousel':
    case 'video':
      return <Play className={className} aria-hidden="true" />
    case 'image_text':
      return <ImageIcon className={className} aria-hidden="true" />
    case 'rich_text':
      return <Type className={className} aria-hidden="true" />
    case 'faq':
      return <HelpCircle className={className} aria-hidden="true" />
    case 'testimonials':
      return <MessageSquare className={className} aria-hidden="true" />
    case 'cta':
      return <MousePointerClick className={className} aria-hidden="true" />
    case 'stats':
      return <BarChart3 className={className} aria-hidden="true" />
    case 'logo_cloud':
      return <Award className={className} aria-hidden="true" />
    case 'newsletter':
      return <Mail className={className} aria-hidden="true" />
    case 'spacer':
      return <Minus className={className} aria-hidden="true" />
    case 'footer':
      return <PanelBottom className={className} aria-hidden="true" />
    case 'cart_items':
      return <ShoppingCart className={className} aria-hidden="true" />
    case 'account_dashboard':
      return <UserRound className={className} aria-hidden="true" />
    case 'offer_hero':
    case 'countdown':
      return <Timer className={className} aria-hidden="true" />
    case 'thank_you_message':
      return <CheckCircle2 className={className} aria-hidden="true" />
    case 'not_found_message':
      return <AlertCircle className={className} aria-hidden="true" />
    case 'product_grid':
    case 'product_catalog':
    case 'category_grid':
      return <Grid2X2 className={className} aria-hidden="true" />
    case 'header':
    case 'hero':
    default:
      return <LayoutTemplate className={className} aria-hidden="true" />
  }
}
