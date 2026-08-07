import { redirect } from 'next/navigation'
import { DEFAULT_LOCALE } from '@/lib/utils/constants'

export default function RootPage() {
  redirect(`/${DEFAULT_LOCALE}/login`)
}
