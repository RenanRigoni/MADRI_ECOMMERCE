import Image from 'next/image'
import Link from 'next/link'
import { requireAdminUser } from '@/lib/admin/auth'
import { readCommerceConfig } from '@/lib/payments/env'
import { createSupabaseAdmin } from '@/lib/server/supabase-admin'
import { listAdminProducts, type AdminProductRow } from '@/lib/admin/products'
import { toggleProductActive, toggleProductFeatured } from './actions'

type StockFilter = 'com-estoque' | 'sem-estoque'
type PhotoFilter = 'sem-foto'
type PromoFilter = 'ativa'
type SortOption = 'recentes' | 'preco-asc' | 'preco-desc' | 'estoque-asc' | 'estoque-desc'

interface SearchParams {
  q?: string
  marca?: string
  estoque?: StockFilter
  foto?: PhotoFilter
  promo?: PromoFilter
  ordenar?: SortOption
}

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

function hasActivePromo(product: AdminProductRow): boolean {
  return (product.discount_percent ?? 0) > 0
}

function applyFilters(products: AdminProductRow[], params: SearchParams): AdminProductRow[] {
  const query = params.q?.trim().toLowerCase()

  return products.filter((product) => {
    if (query && !product.name.toLowerCase().includes(query)) return false
    if (params.marca && product.brand !== params.marca) return false
    if (params.estoque === 'com-estoque' && product.stock_on_hand <= 0) return false
    if (params.estoque === 'sem-estoque' && product.stock_on_hand > 0) return false
    if (params.foto === 'sem-foto' && product.images.length > 0) return false
    if (params.promo === 'ativa' && !hasActivePromo(product)) return false
    return true
  })
}

function applySort(products: AdminProductRow[], sort: SortOption | undefined): AdminProductRow[] {
  const sorted = [...products]
  switch (sort) {
    case 'preco-asc':
      return sorted.sort((a, b) => (a.price_cents ?? Infinity) - (b.price_cents ?? Infinity))
    case 'preco-desc':
      return sorted.sort((a, b) => (b.price_cents ?? -Infinity) - (a.price_cents ?? -Infinity))
    case 'estoque-asc':
      return sorted.sort((a, b) => a.stock_on_hand - b.stock_on_hand)
    case 'estoque-desc':
      return sorted.sort((a, b) => b.stock_on_hand - a.stock_on_hand)
    default:
      return sorted
  }
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireAdminUser()
  const params = await searchParams
  const supabase = createSupabaseAdmin(readCommerceConfig())
  const allProducts = await listAdminProducts(supabase)

  const brands = Array.from(new Set(allProducts.map((p) => p.brand).filter((b): b is string => Boolean(b)))).sort(
    (a, b) => a.localeCompare(b, 'pt-BR'),
  )

  const filtered = applySort(applyFilters(allProducts, params), params.ordenar)
  const hasActiveFilters = Boolean(
    params.q || params.marca || params.estoque || params.foto || params.promo || (params.ordenar && params.ordenar !== 'recentes'),
  )

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          Produtos ({filtered.length}{hasActiveFilters ? ` de ${allProducts.length}` : ''})
        </h1>
        <Link href="/admin/produtos/novo" className="bg-[#0A0A0A] text-white px-5 py-2.5 text-sm font-medium">
          + Novo produto
        </Link>
      </div>

      <form method="get" className="mt-6 bg-white border border-[#E8E0D4] p-4 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="q" className="text-xs text-[#6B7280]">Buscar</label>
          <input
            id="q"
            name="q"
            type="text"
            defaultValue={params.q ?? ''}
            placeholder="Nome do produto…"
            className="border border-[#D7CFC0] px-3 py-2 text-sm min-w-[200px]"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="marca" className="text-xs text-[#6B7280]">Marca</label>
          <select id="marca" name="marca" defaultValue={params.marca ?? ''} className="border border-[#D7CFC0] px-3 py-2 text-sm">
            <option value="">Todas</option>
            {brands.map((brand) => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="estoque" className="text-xs text-[#6B7280]">Estoque</label>
          <select id="estoque" name="estoque" defaultValue={params.estoque ?? ''} className="border border-[#D7CFC0] px-3 py-2 text-sm">
            <option value="">Todos</option>
            <option value="com-estoque">Em estoque</option>
            <option value="sem-estoque">Sem estoque</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="foto" className="text-xs text-[#6B7280]">Fotos</label>
          <select id="foto" name="foto" defaultValue={params.foto ?? ''} className="border border-[#D7CFC0] px-3 py-2 text-sm">
            <option value="">Todos</option>
            <option value="sem-foto">Sem foto</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="promo" className="text-xs text-[#6B7280]">Promoção</label>
          <select id="promo" name="promo" defaultValue={params.promo ?? ''} className="border border-[#D7CFC0] px-3 py-2 text-sm">
            <option value="">Todos</option>
            <option value="ativa">Com promoção ativa</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="ordenar" className="text-xs text-[#6B7280]">Ordenar por</label>
          <select id="ordenar" name="ordenar" defaultValue={params.ordenar ?? 'recentes'} className="border border-[#D7CFC0] px-3 py-2 text-sm">
            <option value="recentes">Mais recentes</option>
            <option value="preco-asc">Preço: mais barato</option>
            <option value="preco-desc">Preço: mais caro</option>
            <option value="estoque-desc">Estoque: maior quantidade</option>
            <option value="estoque-asc">Estoque: menor quantidade</option>
          </select>
        </div>

        <button type="submit" className="bg-[#0A0A0A] text-white px-5 py-2 text-sm font-medium">
          Filtrar
        </button>
        {hasActiveFilters ? (
          <Link href="/admin/produtos" className="text-sm underline underline-offset-4 text-[#6B7280]">
            Limpar filtros
          </Link>
        ) : null}
      </form>

      {filtered.length === 0 ? (
        <p className="mt-8 text-[#6B7280]">Nenhum produto encontrado para esses filtros.</p>
      ) : (
        <div className="mt-6 divide-y divide-[#E8E0D4] border-y border-[#E8E0D4] bg-white">
          {filtered.map((product) => (
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
                  {hasActivePromo(product) ? ` · promoção -${product.discount_percent}%` : ''}
                  {!product.active ? ' · inativo' : ''}
                </p>
                {!readyToActivate(product) ? (
                  <p className="text-xs text-[#B5363A] mt-0.5">Preencha preço, peso e dimensões pra poder ativar</p>
                ) : null}
              </div>
              <form action={toggleProductFeatured.bind(null, product.id, !product.is_featured)}>
                <button
                  type="submit"
                  aria-label={product.is_featured ? 'Remover destaque' : 'Marcar como destaque'}
                  title={product.is_featured ? 'Remover destaque' : 'Marcar como destaque'}
                  className={`shrink-0 text-2xl leading-none px-1 ${
                    product.is_featured ? 'text-[#C4A55C]' : 'text-[#D7CFC0]'
                  }`}
                >
                  {product.is_featured ? '★' : '☆'}
                </button>
              </form>
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
