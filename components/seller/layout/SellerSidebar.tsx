'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  BarChart3,
  GitBranch,
  Globe2,
  ImageIcon,
  LayoutDashboard,
  Mail,
  Package,
  Palette,
  Receipt,
  Settings,
  ShoppingCart,
  Store,
  Ticket,
  Users,
  Zap,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'

type NavItem = {
  key: string
  path: (locale: string) => string
  icon: React.ElementType
  disabled?: boolean
}

const NAV_GROUPS: Array<{ groupKey: string; items: NavItem[] }> = [
  {
    groupKey: 'store',
    items: [
      { key: 'dashboard', path: (l) => `/${l}/seller`, icon: LayoutDashboard },
      { key: 'products', path: (l) => `/${l}/seller/products`, icon: Package },
      { key: 'media', path: (l) => `/${l}/seller/media`, icon: ImageIcon },
      { key: 'theme', path: (l) => `/${l}/seller/theme`, icon: Palette },
      { key: 'domains', path: (l) => `/${l}/seller/domains`, icon: Globe2 },
    ],
  },
  {
    groupKey: 'growth',
    items: [
      { key: 'orders', path: (l) => `/${l}/seller/orders`, icon: ShoppingCart, disabled: true },
      { key: 'coupons', path: (l) => `/${l}/seller/coupons`, icon: Ticket, disabled: true },
      { key: 'analytics', path: (l) => `/${l}/seller/analytics`, icon: BarChart3, disabled: true },
      { key: 'funnels', path: (l) => `/${l}/seller/funnels`, icon: GitBranch, disabled: true },
    ],
  },
  {
    groupKey: 'content',
    items: [
      { key: 'email', path: (l) => `/${l}/seller/email`, icon: Mail, disabled: true },
      { key: 'automation', path: (l) => `/${l}/seller/automation`, icon: Zap, disabled: true },
      { key: 'crm', path: (l) => `/${l}/seller/crm`, icon: Users, disabled: true },
      { key: 'vat', path: (l) => `/${l}/seller/vat`, icon: Receipt, disabled: true },
    ],
  },
  {
    groupKey: 'account',
    items: [
      { key: 'settings', path: (l) => `/${l}/seller/settings`, icon: Settings },
    ],
  },
]

export function SellerSidebar({
  locale,
  storeName,
}: {
  locale: string
  storeName: string | null
}) {
  const t = useTranslations('seller')
  const router = useRouter()
  const pathname = usePathname()
  const root = `/${locale}/seller`

  return (
    <Sidebar side={locale === 'ar' ? 'right' : 'left'} variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 rounded-lg px-2 py-2">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Store className="size-4" aria-hidden="true" />
              </div>
              <div className="grid min-w-0 flex-1 text-start text-sm leading-tight">
                <span className="truncate font-semibold">
                  {storeName ?? t('nav.dashboard')}
                </span>
                <span className="truncate text-xs text-sidebar-foreground/50">
                  Seller
                </span>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.groupKey}>
            <SidebarGroupLabel>
              {t(`nav.group.${group.groupKey}`, {
                defaultValue: group.groupKey,
              })}
            </SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map(({ key, path, icon: Icon, disabled }) => {
                const href = path(locale)
                const active =
                  key === 'dashboard'
                    ? pathname === root
                    : pathname.startsWith(href)

                return (
                  <SidebarMenuItem key={key}>
                    <SidebarMenuButton
                      tooltip={t(`nav.${key}`, { defaultValue: key })}
                      onClick={() => {
                        if (!disabled) router.push(href)
                      }}
                      disabled={disabled}
                      aria-disabled={disabled || undefined}
                      data-active={active}
                      className={
                        active
                          ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                          : undefined
                      }
                    >
                      <Icon />
                      <span>{t(`nav.${key}`, { defaultValue: key })}</span>
                      {disabled && (
                        <Badge
                          variant="outline"
                          className="ms-auto h-4 px-1.5 text-[10px]"
                        >
                          {t('nav.comingSoon')}
                        </Badge>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  )
}
