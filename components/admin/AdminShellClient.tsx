'use client'

import { useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarProvider, SidebarTrigger, SidebarInset,
} from '@/components/ui/sidebar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  LayoutDashboard, Package, ShoppingCart, Ticket, LogOut,
  BarChart3, Users, GitBranch, Mail, Zap, Bot, HelpCircle, Palette,
  ChevronsUpDown, Settings, User, Languages, ImageIcon, CheckCircle2,
  Receipt, Loader2Icon,
} from 'lucide-react'
import { useAdminMe } from '@/hooks/queries/useAdminMe'
import { useActiveBrand, BRANDS, type Brand } from '@/lib/admin/brand-context'
import { useQueryClient } from '@tanstack/react-query'

type NavItem = { key: string; path: (l: string) => string; icon: React.ElementType }

const NAV_GROUPS: Array<{ groupKey: string; items: NavItem[] }> = [
  {
    groupKey: 'store',
    items: [
      { key: 'dashboard', path: (l) => `/${l}`, icon: LayoutDashboard },
      { key: 'products', path: (l) => `/${l}/products`, icon: Package },
      { key: 'orders', path: (l) => `/${l}/orders`, icon: ShoppingCart },
      { key: 'coupons', path: (l) => `/${l}/coupons`, icon: Ticket },
    ],
  },
  {
    groupKey: 'growth',
    items: [
      { key: 'analytics', path: (l) => `/${l}/analytics`, icon: BarChart3 },
      { key: 'crm', path: (l) => `/${l}/crm`, icon: Users },
    ],
  },
  {
    groupKey: 'funnels',
    items: [
      { key: 'funnels', path: (l) => `/${l}/funnels`, icon: GitBranch },
      { key: 'email', path: (l) => `/${l}/email`, icon: Mail },
      { key: 'automation', path: (l) => `/${l}/automation`, icon: Zap },
    ],
  },
  {
    groupKey: 'tools',
    items: [
      { key: 'ai-tools', path: (l) => `/${l}/ai-tools`, icon: Bot },
      { key: 'quizzes', path: (l) => `/${l}/quizzes`, icon: HelpCircle },
      // { key: 'brand', path: (l) => `/${l}/brand`, icon: Palette },
      { key: 'vat', path: (l) => `/${l}/vat`, icon: Receipt },
    ],
  },
  {
    groupKey: 'content',
    items: [
      { key: 'media', path: (l) => `/${l}/media`, icon: ImageIcon },
      // { key: 'localization', path: (l) => `/${l}/localization`, icon: Languages },
    ],
  },
]

function BrandSwitcher() {
  const { activeBrand, setActiveBrand } = useActiveBrand()
  const queryClient = useQueryClient()

  function handleSwitch(brand: Brand) {
    setActiveBrand(brand)
    queryClient.invalidateQueries({ queryKey: ['admin'] })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-start hover:bg-sidebar-accent transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring">
        <div className="grid flex-1 text-start text-sm leading-tight">
          <span className="truncate font-semibold">{activeBrand.name}</span>
          <span className="truncate text-xs text-sidebar-foreground/50">Admin Dashboard</span>
        </div>
        <ChevronsUpDown className="ml-auto size-4 shrink-0 text-sidebar-foreground/50" />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="start" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Switch Brand</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {BRANDS.map((brand) => (
          <DropdownMenuItem
            key={brand.id}
            onClick={() => handleSwitch(brand)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <span className="flex-1 text-sm">{brand.name}</span>
            {activeBrand.id === brand.id && (
              <CheckCircle2 className="size-4 text-primary shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function AdminProfileDropdown({ locale, onLogout }: { locale: string; onLogout: () => void }) {
  const { data: admin } = useAdminMe()
  const router = useRouter()

  const initials = admin
    ? `${admin.first_name?.[0] ?? ''}${admin.last_name?.[0] ?? ''}`.toUpperCase() || 'A'
    : 'A'
  const displayName = admin
    ? [admin.first_name, admin.last_name].filter(Boolean).join(' ') || admin.email
    : '…'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-start hover:bg-sidebar-accent transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring">
        <Avatar className="size-8 rounded-lg">
          <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-xs font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="grid flex-1 text-start text-sm leading-tight">
          <span className="truncate font-semibold">{displayName}</span>
          <span className="truncate text-xs text-sidebar-foreground/50">{admin?.email ?? ''}</span>
        </div>
        <ChevronsUpDown className="ml-auto size-4 shrink-0 text-sidebar-foreground/50" />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-56 rounded-lg">
        <DropdownMenuLabel className="text-xs text-muted-foreground">My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push(`/${locale}/profile`)}>
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push(`/${locale}/brand`)}>
            <Settings className="mr-2 h-4 w-4" />
            Brand Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push(`/${locale}/localization`)}>
            <Languages className="mr-2 h-4 w-4" />
            Localization
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function LocaleSwitcher({ locale }: { locale: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function switchTo(newLocale: string) {
    if (newLocale === locale) return
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`)
    startTransition(() => {
      router.push(newPath)
    })
  }

  return (
    <>
      <div className="flex items-center gap-0.5 rounded-md border bg-muted/40 p-0.5 text-xs">
        {(['ar', 'en'] as const).map((l) => (
          <button
            key={l}
            onClick={() => switchTo(l)}
            disabled={isPending}
            className={cn(
              'rounded px-2 py-0.5 font-medium uppercase transition-colors',
              locale === l
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
              isPending && 'cursor-wait'
            )}
          >
            {l}
          </button>
        ))}
      </div>
      {isPending && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background/50 backdrop-blur-sm">
          <Loader2Icon className="size-10 animate-spin text-primary" />
        </div>
      )}
    </>
  )
}

function PageHeader({ locale }: { locale: string }) {
  const pathname = usePathname()
  const t = useTranslations('admin')

  const segments = pathname.replace(`/${locale}`, '').split('/').filter(Boolean)
  const pageKey = segments[0]
  const pageLabel = pageKey
    ? t(`nav.${pageKey}`, { defaultValue: pageKey.charAt(0).toUpperCase() + pageKey.slice(1).replace(/-/g, ' ') })
    : 'Dashboard'

  return (
    <div className="flex items-center gap-1.5 text-sm min-w-0">
      <span className="text-muted-foreground hidden sm:inline">Admin</span>
      {pageKey && (
        <>
          <span className="text-muted-foreground/40 hidden sm:inline">/</span>
          <span className="font-medium text-foreground truncate">{pageLabel}</span>
        </>
      )}
      {!pageKey && <span className="font-medium text-foreground">Dashboard</span>}
    </div>
  )
}

export function AdminShellClient({ children, locale }: { children: React.ReactNode; locale: string }) {
  const t = useTranslations('admin')
  const router = useRouter()
  const pathname = usePathname()
  const { activeBrand } = useActiveBrand()

  async function handleLogout() {
    await fetch('/api/admin/auth/logout', { method: 'POST', headers: { 'x-locale': locale } })
    router.push(`/${locale}/login`)
    router.refresh()
  }

  return (
    <SidebarProvider>
      <Sidebar side={locale === 'ar' ? 'right' : 'left'} variant="inset">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <BrandSwitcher />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          {NAV_GROUPS.map((group) => (
            <SidebarGroup key={group.groupKey}>
              <SidebarGroupLabel>
                {t(`nav.group.${group.groupKey}`, { defaultValue: group.groupKey })}
              </SidebarGroupLabel>
              <SidebarMenu>
                {group.items.map(({ key, path, icon: Icon }) => {
                  const href = path(locale)
                  const isLocaleRoot = href === `/${locale}`
                  const active = isLocaleRoot
                    ? pathname === href
                    : pathname.startsWith(href)
                  return (
                    <SidebarMenuItem key={key}>
                      <SidebarMenuButton
                        tooltip={t(`nav.${key}`, { defaultValue: key })}
                        onClick={() => router.push(href)}
                        data-active={active}
                        className={active ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : ''}
                      >
                        <Icon />
                        <span>{t(`nav.${key}`, { defaultValue: key })}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <AdminProfileDropdown locale={locale} onLogout={handleLogout} />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-3 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="h-4 w-px bg-border" />
          <PageHeader locale={locale} />
          <div className="ms-auto flex items-center gap-2">
            <LocaleSwitcher locale={locale} />
            <span className="text-xs font-bold text-primary border border-primary rounded-md px-3 py-1 bg-muted/40 hidden sm:inline-flex items-center gap-1">
              <span>{activeBrand.name}</span>
            </span>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
