'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { LogOut, User } from 'lucide-react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SellerLocaleSwitcher } from './SellerLocaleSwitcher'
import { isTenantActive, type Tenant } from '@/types/dto/tenant.dto'

function PageTitle({ locale }: { locale: string }) {
  const pathname = usePathname()
  const t = useTranslations('seller')

  const segments = pathname
    .replace(`/${locale}/seller`, '')
    .split('/')
    .filter(Boolean)
  const pageKey = segments[0]

  const label = pageKey
    ? t(`nav.${pageKey}`, {
        defaultValue: pageKey.charAt(0).toUpperCase() + pageKey.slice(1),
      })
    : t('nav.dashboard')

  return (
    <div className="flex min-w-0 items-center gap-1.5 text-sm">
      <span className="hidden text-muted-foreground sm:inline">Seller</span>
      <span className="hidden text-muted-foreground/40 sm:inline">/</span>
      <span className="truncate font-medium text-foreground">{label}</span>
    </div>
  )
}

function SellerProfileDropdown({ locale }: { locale: string }) {
  const router = useRouter()
  const t = useTranslations('seller')

  async function handleLogout() {
    try {
      await fetch('/api/subscriber/auth/logout', {
        method: 'POST',
        headers: { 'x-locale': locale },
      })
    } finally {
      router.push(`/${locale}/seller/login`)
      router.refresh()
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-start outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar className="size-8 rounded-lg">
          <AvatarFallback className="rounded-lg bg-primary text-xs font-bold text-primary-foreground">
            S
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end" className="w-52">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {t('nav.group.account')}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => router.push(`/${locale}/seller/settings`)}
          >
            <User className="me-2 size-4" />
            {t('nav.settings')}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => void handleLogout()}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="me-2 size-4" />
          {t('nav.logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function SellerHeader({
  locale,
  tenant,
}: {
  locale: string
  tenant: Tenant | null
}) {
  const active = isTenantActive(tenant)

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b px-4">
      <SidebarTrigger className="-ms-1" />
      <div className="h-4 w-px bg-border" />
      <PageTitle locale={locale} />
      <div className="ms-auto flex items-center gap-2">
        {tenant && (
          <Badge variant={active ? 'secondary' : 'outline'} className="text-[10px]">
            {tenant.status.label}
          </Badge>
        )}
        <SellerLocaleSwitcher locale={locale} />
        <SellerProfileDropdown locale={locale} />
      </div>
    </header>
  )
}
