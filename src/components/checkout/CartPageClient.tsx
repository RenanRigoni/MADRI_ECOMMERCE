'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { useCart } from '@/lib/cart/store'

interface CartCatalogProduct {
  id: string
  slug: string
  name: string
  price: number
  discount: number | null
  stock: number
  imageUrl: string | null
}

function isCartCatalogProduct(value: unknown): value is CartCatalogProduct {
  if (!value || typeof value !== 'object') return false
  const product = value as Record<string, unknown>
  return typeof product.id === 'string'
    && typeof product.slug === 'string'
    && typeof product.name === 'string'
    && typeof product.price === 'number'
    && (product.discount === null || typeof product.discount === 'number')
    && Number.isInteger(product.stock)
    && (product.imageUrl === null || typeof product.imageUrl === 'string')
}

function finalPrice(product: CartCatalogProduct): number {
  return product.discount ? product.price * (1 - product.discount / 100) : product.price
}

function money(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function CartPageClient() {
  const cart = useCart()
  const [catalog, setCatalog] = useState<CartCatalogProduct[]>([])
  const [catalogError, setCatalogError] = useState(false)
  const productIds = useMemo(() => cart.items.map((item) => item.productId).sort(), [cart.items])
  const productIdsKey = productIds.join(',')

  useEffect(() => {
    if (!productIdsKey) return
    const controller = new AbortController()

    async function loadCatalog() {
      const params = new URLSearchParams()
      for (const id of productIds) params.append('id', id)
      try {
        const response = await fetch(`/api/catalog/cart?${params.toString()}`, {
          cache: 'no-store',
          signal: controller.signal,
        })
        const payload: unknown = await response.json().catch(() => null)
        const products = payload && typeof payload === 'object' ? Reflect.get(payload, 'products') : null
        if (!response.ok || !Array.isArray(products) || !products.every(isCartCatalogProduct)) {
          throw new Error('invalid_catalog_response')
        }
        setCatalog(products)
        setCatalogError(false)
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return
        setCatalogError(true)
      }
    }

    void loadCatalog()
    return () => controller.abort()
  }, [productIds, productIdsKey])

  const catalogById = new Map(catalog.map((product) => [product.id, product]))
  const lines = cart.items.map((item) => ({ item, product: catalogById.get(item.productId) }))
  const catalogComplete = lines.length > 0 && lines.every(({ product }) => product)
  const purchasable = catalogComplete
    && lines.every(({ item, product }) => product && finalPrice(product) > 0 && product.stock >= item.quantity)
  const total = lines.reduce((sum, { item, product }) => sum + (product ? finalPrice(product) : 0) * item.quantity, 0)

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-20">
      <h1 className="text-4xl md:text-5xl font-[family-name:var(--font-display)]">Seu carrinho</h1>
      {lines.length === 0 ? (
        <div className="mt-10 border border-[#E8E0D4] bg-[#FAF6F0] p-8 text-center">
          <p className="text-[#6B7280]">Seu carrinho está vazio.</p>
          <Link href="/produtos" className="inline-block mt-5 bg-[#0A0A0A] text-white px-7 py-3 text-xs uppercase tracking-[0.2em]">Ver produtos</Link>
        </div>
      ) : (
        <div className="mt-10 grid lg:grid-cols-[1fr_320px] gap-8">
          <div className="divide-y divide-[#E8E0D4] border-y border-[#E8E0D4]">
            {lines.map(({ item, product }) => (
              <article key={item.productId} className="py-5 flex gap-4">
                <div className="relative w-20 h-24 bg-[#FAF6F0] shrink-0">
                  {product?.imageUrl ? <Image src={product.imageUrl} alt="" fill className="object-cover" sizes="80px" /> : null}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold">{product?.name ?? 'Produto indisponível'}</h2>
                  <p className="text-sm text-[#6B7280] mt-1">{product && finalPrice(product) > 0 ? money(finalPrice(product)) : 'Preço indisponível'}</p>
                  <div className="flex items-center gap-2 mt-4">
                    <button aria-label="Diminuir quantidade" onClick={() => item.quantity === 1 ? cart.remove(item.productId) : cart.setQuantity(item.productId, item.quantity - 1)} className="p-1 border border-[#E8E0D4]"><Minus size={14} /></button>
                    <span className="w-8 text-center text-sm" aria-label={`Quantidade ${item.quantity}`}>{item.quantity}</span>
                    <button aria-label="Aumentar quantidade" onClick={() => cart.setQuantity(item.productId, item.quantity + 1)} disabled={item.quantity >= 10} className="p-1 border border-[#E8E0D4] disabled:opacity-40"><Plus size={14} /></button>
                    <button aria-label="Remover item" onClick={() => cart.remove(item.productId)} className="ml-3 p-1 text-[#B5363A]"><Trash2 size={15} /></button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <aside className="bg-[#FAF6F0] border border-[#E8E0D4] p-6 h-fit">
            <h2 className="text-xl font-semibold">Resumo</h2>
            {catalogError ? <p role="alert" className="mt-4 text-sm text-[#B5363A]">Não foi possível carregar os produtos do carrinho. Atualize a página.</p> : null}
            <div className="flex justify-between mt-5 pt-5 border-t border-[#E8E0D4]"><span>Total estimado</span><strong>{purchasable ? money(total) : '—'}</strong></div>
            <p className="text-xs text-[#6B7280] mt-3">Preço e estoque serão confirmados no servidor antes do pagamento.</p>
            {purchasable ? (
              <Link href="/checkout" className="block text-center mt-6 bg-[#0A0A0A] text-white px-6 py-3 text-xs uppercase tracking-[0.2em]">Ir para checkout</Link>
            ) : (
              <p role="status" className="mt-6 border border-[#E8E0D4] bg-white p-4 text-sm text-[#6B7280]">O pagamento será liberado quando todos os produtos tiverem preço e estoque válidos.</p>
            )}
          </aside>
        </div>
      )}
    </section>
  )
}
