'use client'

import { useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Loader2Icon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SellerLocaleSwitcher({ locale }: { locale: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function switchTo(nextLocale: string) {
    if (nextLocale === locale) return
    const nextPath = pathname.replace(`/${locale}`, `/${nextLocale}`)
    startTransition(() => {
      router.push(nextPath)
    })
  }

  return (
    <>
      <div className="flex items-center gap-0.5 rounded-md border bg-muted/40 p-0.5 text-xs">
        {(['ar', 'en'] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => switchTo(item)}
            disabled={isPending}
            aria-label={item === 'ar' ? 'العربية' : 'English'}
            className={cn(
              'rounded px-2 py-0.5 font-medium uppercase transition-colors',
              locale === item
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
              isPending && 'cursor-wait',
            )}
          >
            {item}
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
