import Image from 'next/image'
import Link from 'next/link'
import { requireAdminUser } from '@/lib/admin/auth'
import { readCommerceConfig } from '@/lib/payments/env'
import { createSupabaseAdmin } from '@/lib/server/supabase-admin'
import { listAdminProducts, type AdminProductRow } from '@/lib/admin/products'
import { toggleProductActive } from './actions'

function money(cents: number | null): string {
  if (cents === null) return 'Sem preço'
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function readyToActivate(product: AdminProductRow): boolean {
  return (
    product.price_cents !== null
    && product.weight_grams !== null
    && product.height_cm !== null
    && product.width_cm !== null
    && product.length_cm !== null
  )
}

export default async function AdminProductsPage() {
  await requireAdminUser()
  const supabase = createSupabaseAdmin(readCommerceConfig())
  const products = await listAdminProducts(supabase)

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Produtos ({products.length})</h1>
        <Link href="/admin/produtos/novo" className="bg-[#0A0A0A] text-white px-5 py-2.5 text-sm font-medium">
          + Novo produto
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="mt-8 text-[#6B7280]">Nenhum produto cadastrado ainda.</p>
      ) : (
        <div className="mt-6 divide-y divide-[#E8E0D4] border-y border-[#E8E0D4] bg-white">
          {products.map((product) => (
            <div key={product.id} className="flex items-center gap-4 p-4">
              <div className="relative w-14 h-16 bg-[#FAF6F0] shrink-0">
                {product.images[0] ? (
                  <Image src={product.images[0]} alt="" fill className="object-cover" sizes="56px" />
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{product.name}</p>
                <p className="text-sm text-[#6B7280]">
                  {money(product.price_cents)} · estoque {product.stock_on_hand}
                  {!product.active ? ' · inativo' : ''}
                </p>
                {!readyToActivate(product) ? (
                  <p className="text-xs text-[#B5363A] mt-0.5">Preencha preço, peso e dimensões pra poder ativar</p>
                ) : null}
              </div>
              <Link
                href={`/admin/produtos/${product.id}`}
                className="text-sm underline underline-offset-4 shrink-0"
              >
                Editar
              </Link>
              {product.active || readyToActivate(product) ? (
                <form action={toggleProductActive.bind(null, product.id, !product.active)}>
                  <button
                    type="submit"
                    className={`shrink-0 text-sm px-3 py-1.5 border ${
                      product.active ? 'border-[#B5363A] text-[#B5363A]' : 'border-[#2D6A4F] text-[#2D6A4F]'
                    }`}
                  >
                    {product.active ? 'Desativar' : 'Ativar'}
                  </button>
                </form>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
