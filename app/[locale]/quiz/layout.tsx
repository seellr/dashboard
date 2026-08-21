import { QueryProvider } from '@/lib/admin/query-provider'
import { Toaster } from 'sileo'

export default function PublicQuizLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      {children}
      <Toaster />
    </QueryProvider>
  )
}
