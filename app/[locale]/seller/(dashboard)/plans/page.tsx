import { getTranslations } from 'next-intl/server'
import { Check } from 'lucide-react'
import { sellerFetchServer } from '@/lib/seller/api-server'
import { PlanSchema, type Plan } from '@/types/dto/plan.dto'

function planName(
  name: Plan['name'],
  locale: string,
): string {
  if (!name) return '—'
  if (typeof name === 'string') return name
  return locale === 'ar' ? name.ar : name.en
}

function featureLabel(feature: unknown): string | null {
  if (typeof feature === 'string') return feature
  if (feature && typeof feature === 'object') {
    const record = feature as { label?: unknown; name?: unknown }
    if (typeof record.label === 'string') return record.label
    if (typeof record.name === 'string') return record.name
  }
  return null
}

export default async function SellerPlansPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations('seller.plans')
  const result = await sellerFetchServer<unknown>('/plans')

  let plans: Plan[] = []
  if (result.ok && Array.isArray(result.data)) {
    plans = result.data.flatMap((item) => {
      const parsed = PlanSchema.safeParse(item)
      return parsed.success ? [parsed.data] : []
    })
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {t('description')}
        </p>
      </div>

      {!result.ok && (
        <p role="alert" className="text-sm text-destructive">
          {result.message}
        </p>
      )}

      {result.ok && plans.length === 0 && (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          {t('empty')}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan, index) => {
          const features = (plan.features ?? [])
            .map(featureLabel)
            .filter((value): value is string => value !== null)
          const active = plan.is_active ?? plan.active ?? true
          return (
            <article
              key={plan.ulid ?? plan.slug ?? String(index)}
              className="space-y-4 rounded-xl border p-5"
            >
              <div>
                <h2 className="text-lg font-semibold">
                  {planName(plan.name, locale)}
                </h2>
                {plan.description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {typeof plan.description === 'string'
                      ? plan.description
                      : locale === 'ar'
                        ? plan.description.ar
                        : plan.description.en}
                  </p>
                )}
              </div>

              <p className="text-2xl font-semibold">
                {plan.price_monthly ?? plan.monthly_price ?? plan.price ?? '—'}{' '}
                <span className="text-sm font-normal text-muted-foreground">
                  {plan.currency ?? ''}
                </span>
              </p>

              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">{t('maxSites')}</dt>
                  <dd>{plan.max_sites ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t('maxProducts')}</dt>
                  <dd>{plan.max_products ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t('trialDays')}</dt>
                  <dd>{plan.trial_days ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t('status')}</dt>
                  <dd>{active ? t('available') : t('unavailable')}</dd>
                </div>
              </dl>

              {features.length > 0 && (
                <ul className="space-y-1.5 text-sm">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden="true" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              )}

              <p className="text-xs text-muted-foreground">{t('readOnly')}</p>
            </article>
          )
        })}
      </div>
    </div>
  )
}
