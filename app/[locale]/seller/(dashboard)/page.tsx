import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import {
  CreditCard,
  Globe2,
  ImageIcon,
  Package,
  Palette,
  Settings,
  Store,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { getSellerTenant } from '@/lib/seller/tenant'
import { sellerFetchServer } from '@/lib/seller/api-server'
import {
  MeResponseSchema,
  SubscriberUserSchema,
  type SubscriberUser,
} from '@/types/dto/subscriber-auth.dto'
import { PLAN_STATUS, PLAN_STATUS_LABELS } from '@/types/dto/plan.dto'

function planStatusId(user: SubscriberUser): number | null {
  if (typeof user.plan_status === 'number') return user.plan_status
  if (user.plan_status && typeof user.plan_status === 'object') {
    return user.plan_status.id
  }
  return null
}

export default async function SellerDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations('seller.dashboard')
  const { tenant } = await getSellerTenant()
  const me = await sellerFetchServer<unknown>('/subscriber/auth/me')

  let user: SubscriberUser | null = null
  if (me.ok) {
    const parsed = MeResponseSchema.safeParse(me.data)
    if (parsed.success) {
      user = 'user' in parsed.data ? parsed.data.user : SubscriberUserSchema.parse(parsed.data)
    }
  }

  const planId = user ? planStatusId(user) : null
  const planLabel = planId ? (PLAN_STATUS_LABELS[planId] ?? String(planId)) : '—'

  const links = [
    { key: 'products', href: `/${locale}/seller/products`, icon: Package },
    { key: 'media', href: `/${locale}/seller/media`, icon: ImageIcon },
    { key: 'theme', href: `/${locale}/seller/theme`, icon: Palette },
    { key: 'domains', href: `/${locale}/seller/domains`, icon: Globe2 },
    { key: 'plans', href: `/${locale}/seller/plans`, icon: CreditCard },
    { key: 'settings', href: `/${locale}/seller/settings`, icon: Settings },
  ] as const

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {t('description')}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Store className="size-4" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-base">{t('storeTitle')}</CardTitle>
              <CardDescription>{t('storeDescription')}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t('storeName')}</span>
              <span className="font-medium">{tenant?.name ?? '—'}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t('storeStatus')}</span>
              <span className="font-medium">{tenant?.status.label ?? '—'}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t('storeDomain')}</span>
              <span className="truncate font-medium">{tenant?.domain ?? '—'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CreditCard className="size-4" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-base">{t('accountTitle')}</CardTitle>
              <CardDescription>{t('accountDescription')}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t('name')}</span>
              <span className="font-medium">
                {[user?.first_name, user?.last_name].filter(Boolean).join(' ') || '—'}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t('email')}</span>
              <span className="truncate font-medium">{user?.email ?? '—'}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t('plan')}</span>
              <span className="font-medium">{planLabel}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t('trialEnds')}</span>
              <span className="font-medium">{user?.trial_ends_at ?? '—'}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{t('subscriptionEnds')}</span>
              <span className="font-medium">{user?.subscription_ends_at ?? '—'}</span>
            </div>
            {planId === PLAN_STATUS.Trial && (
              <Link
                href={`/${locale}/seller/plans`}
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
              >
                {t('viewPlans')}
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {links.map(({ key, href, icon: Icon }) => (
          <Link
            key={key}
            href={href}
            className="rounded-xl border p-4 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Icon className="size-5 text-primary" aria-hidden="true" />
            <p className="mt-3 font-medium">{t(`links.${key}`)}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t(`links.${key}Description`)}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
