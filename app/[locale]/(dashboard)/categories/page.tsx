import { adminFetchServer } from '@/lib/admin/api-server'
import { CategoriesClient } from '@/components/admin/categories/CategoriesClient'
import type { Category } from '@/components/admin/categories/CategoriesClient'

export default async function AdminCategoriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  const result = await adminFetchServer<Category[]>('/admin/categories?brand_id=1&active_only=0')
  const categories = result.ok ? result.data : []

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Categories</h1>
      <CategoriesClient locale={locale} initialCategories={categories} />
    </div>
  )
}
