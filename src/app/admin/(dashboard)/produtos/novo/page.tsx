import { requireAdminUser } from '@/lib/admin/auth'
import ProductForm from '@/components/admin/ProductForm'

export default async function NewProductPage() {
  await requireAdminUser()
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Novo produto</h1>
      <ProductForm />
    </div>
  )
}
