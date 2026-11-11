import { ProductWizard } from '@/components/seller/store/ProductWizard'

export default async function SellerEditProductPage({
  params,
}: {
  params: Promise<{ ulid: string }>
}) {
  const { ulid } = await params
  return <ProductWizard initialUlid={ulid} />
}
