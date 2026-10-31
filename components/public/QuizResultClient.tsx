'use client'

import Link from 'next/link'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Award, ShoppingBag } from 'lucide-react'
import { usePublicQuizResultQuery } from '@/hooks/queries/useQuizzes'

interface Props {
  locale: string
  ulid: string
}

export function QuizResultClient({ locale, ulid }: Props) {
  const { data: resultData, isLoading, error } = usePublicQuizResultQuery(ulid)
  const isRtl = locale === 'ar'

  if (isLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-8 w-3/4 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-20 w-full mb-4" />
      </Card>
    )
  }

  if (error || !resultData) {
    return (
      <Card className="p-8 text-center border-destructive">
        <h2 className="text-xl font-bold text-destructive mb-2">Result Not Found</h2>
        <p className="text-sm text-muted-foreground">The requested quiz result could not be found or has expired.</p>
      </Card>
    )
  }

  const archetype = resultData.archetype
  const products = resultData.products || archetype?.products || []

  return (
    <Card className="shadow-xl border-primary/20 overflow-hidden">
      <div className="bg-gradient-to-br from-primary/15 via-primary/5 to-background p-8 text-center flex flex-col items-center gap-3 border-b">
        <div className="size-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg mb-1">
          <Award className="size-8" />
        </div>

        <Badge variant="outline" className="text-xs uppercase tracking-widest border-primary/40 text-primary">
          {isRtl ? 'النتيجة الخاصة بك' : 'Your Result Archetype'}
        </Badge>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground">{archetype?.name || 'Your Result'}</h1>

        {archetype?.headline && <p className="text-base sm:text-lg font-semibold text-primary">{archetype.headline}</p>}
      </div>

      <CardContent className="p-6 sm:p-8 flex flex-col gap-6">
        {archetype?.description && (
          <div className="bg-card p-5 rounded-xl border text-sm leading-relaxed text-muted-foreground shadow-sm">
            {archetype.description}
          </div>
        )}

        {products.length > 0 && (
          <div className="flex flex-col gap-4 pt-2">
            <div className="flex items-center gap-2">
              <ShoppingBag className="size-5 text-primary" />
              <h3 className="text-lg font-bold">{isRtl ? 'التوصيات المخصصة لك' : 'Recommended Solutions'}</h3>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {products.map((prod) => (
                <div
                  key={prod.ulid}
                  className="p-5 rounded-xl border bg-card hover:border-primary/50 transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-base">{prod.name || prod.internal_name}</span>
                    {prod.one_liner && <span className="text-xs text-muted-foreground line-clamp-2">{prod.one_liner}</span>}
                    <span className="text-sm font-bold text-primary pt-1">
                      {prod.base_price} {prod.currency}
                    </span>
                  </div>

                  <Link href={`/${locale}/products`}>
                    <Button size="sm" className="shrink-0 shadow-sm">
                      {isRtl ? 'عرض التفاصيل' : 'View Product'}
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-6 bg-muted/20 border-t justify-center">
        <Link href={`/${locale}`}>
          <Button variant="outline">{isRtl ? 'الرئيسية' : 'Back to Home'}</Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
