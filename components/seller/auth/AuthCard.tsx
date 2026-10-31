import { Store } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function AuthCard({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Store className="size-6" aria-hidden="true" />
        </div>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
