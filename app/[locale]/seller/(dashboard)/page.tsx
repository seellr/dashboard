import { getTranslations } from 'next-intl/server'
import { Package, Palette, Store } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { getSellerTenant } from '@/lib/seller/tenant'

export default async function SellerDashboardPage() {
  const t = await getTranslations('seller')
  const { tenant } = await getSellerTenant()

  const sections = [
    { key: 'products', icon: Package },
    { key: 'theme', icon: Palette },
    { key: 'settings', icon: Store },
  ] as const

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t('dashboard.title')}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {tenant?.name
            ? `${tenant.name} — ${t('dashboard.description')}`
            : t('dashboard.description')}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map(({ key, icon: Icon }) => (
          <Card key={key}>
            <CardHeader className="flex-row items-center gap-3 space-y-0">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-4" aria-hidden="true" />
              </div>
              <div className="space-y-0.5">
                <CardTitle className="text-base">
                  {t(`nav.${key}`, { defaultValue: key })}
                </CardTitle>
                <CardDescription className="text-xs">
                  {t('common.comingSoon')}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {t('phasePlaceholder.description')}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
