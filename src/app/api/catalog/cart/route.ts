import type { NextRequest } from 'next/server'
import { MAX_CART_ITEMS } from '@/lib/checkout/quote'
import { getPerfumeById, primaryImage } from '@/lib/perfumes'
import { apiJson } from '@/lib/server/api-response'

export const runtime = 'nodejs'

const PRODUCT_ID_PATTERN = /^[A-Za-z0-9_-]{1,160}$/

export async function GET(request: NextRequest) {
  const ids = request.nextUrl.searchParams.getAll('id')
  if (ids.length > MAX_CART_ITEMS || ids.some((id) => !PRODUCT_ID_PATTERN.test(id))) {
    return apiJson({ error: 'Carrinho inválido.' }, 400)
  }

  const uniqueIds = [...new Set(ids)]
  const products = (await Promise.all(uniqueIds.map((id) => getPerfumeById(id)))).flatMap((product) => {
    if (!product) return []
    return [{
      id: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      discount: product.discount,
      stock: product.stock,
      imageUrl: primaryImage(product) ?? null,
    }]
  })

  return apiJson({ products })
}
