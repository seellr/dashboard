import { notFound } from 'next/navigation'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { DirectionProvider } from '@base-ui/react/direction-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { routing } from '@/i18n/routing'

const DIRECTION: Record<string, 'rtl' | 'ltr'> = { ar: 'rtl', en: 'ltr' }

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()

  setRequestLocale(locale)
  const messages = await getMessages()
  const dir = DIRECTION[locale] ?? 'rtl'

  return (
    <>
      {/* Set lang/dir on <html> before first paint */}
      <script
        // biome-ignore lint: needed for early lang/dir injection
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.lang="${locale}";document.documentElement.dir="${dir}";`,
        }}
      />
      <DirectionProvider direction={dir}>
        <NextIntlClientProvider messages={messages}>
          <TooltipProvider>{children}</TooltipProvider>
        </NextIntlClientProvider>
      </DirectionProvider>
    </>
  )
}
