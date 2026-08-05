import { notFound } from 'next/navigation'
import { requireAdminUser } from '@/lib/admin/auth'
import { readCommerceConfig } from '@/lib/payments/env'
import { createSupabaseAdmin } from '@/lib/server/supabase-admin'
import { getAdminProduct } from '@/lib/admin/products'
import ProductForm from '@/components/admin/ProductForm'

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminUser()
  const { id } = await params
  const supabase = createSupabaseAdmin(readCommerceConfig())
  const product = await getAdminProduct(supabase, id)
  if (!product) notFound()

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Editar produto</h1>
      <ProductForm product={product} />
    </div>
  )
}
