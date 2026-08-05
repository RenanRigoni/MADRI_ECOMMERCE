import 'server-only'

import { cache } from 'react'
import { createClient } from '@supabase/supabase-js'
import { readSupabasePublicConfig } from '@/lib/supabase/env'
import { readCommerceConfig } from '@/lib/payments/env'
import { createSupabaseAdmin } from '@/lib/server/supabase-admin'
import type { FragranceFamily, Profile, Intensity } from '@/lib/products'
import { type Perfume, type TipoProduto } from '@/lib/perfumes-shared'

export type { Perfume, TipoProduto, PerfumeFilters } from '@/lib/perfumes-shared'
export { volumeLabel, cardTitle, primaryImage, filterPerfumes } from '@/lib/perfumes-shared'

const CATALOG_COLUMNS = `
  id, slug, brand, product_name, product_line, version, concentration, volume_ml,
  gender, product_type, name, price_cents, discount_percent, stock_on_hand,
  is_new, is_best_seller, is_featured, is_giftable, fragrance_family, fragrance_family_label,
  notes_top, notes_heart, notes_base, style_tags, intensity, occasion,
  short_description, description, meta_title, meta_description, images, research_verified
`

interface ProductRow {
  id: string
  slug: string | null
  brand: string | null
  product_name: string | null
  product_line: string | null
  version: string | null
  concentration: string | null
  volume_ml: number | null
  gender: Profile | null
  product_type: TipoProduto
  name: string
  price_cents: number | null
  discount_percent: number | null
  stock_on_hand: number
  is_new: boolean
  is_best_seller: boolean
  is_featured: boolean
  is_giftable: boolean
  fragrance_family: FragranceFamily | null
  fragrance_family_label: string | null
  notes_top: string[]
  notes_heart: string[]
  notes_base: string[]
  style_tags: string[]
  intensity: Intensity | null
  occasion: string[]
  short_description: string | null
  description: string | null
  meta_title: string | null
  meta_description: string | null
  images: string[]
  research_verified: boolean
}

function toPerfume(row: ProductRow): Perfume {
  return {
    id: row.id,
    slug: row.slug ?? row.id,
    marca: row.brand ?? '',
    nome: row.product_name ?? row.name,
    linha: row.product_line,
    versao: row.version,
    concentracao: row.concentration,
    volumeMl: row.volume_ml,
    genero: row.gender ?? 'unissex',
    tipoProduto: row.product_type,
    name: row.name,
    price: (row.price_cents ?? 0) / 100,
    discount: row.discount_percent,
    stock: row.stock_on_hand,
    isNew: row.is_new,
    isBestSeller: row.is_best_seller,
    isFeatured: row.is_featured,
    isGiftable: row.is_giftable,
    fragranceFamily: row.fragrance_family ?? 'floral',
    fragranceFamilyLabel: row.fragrance_family_label,
    notesTop: row.notes_top,
    notesHeart: row.notes_heart,
    notesBase: row.notes_base,
    profile: row.style_tags,
    intensity: row.intensity ?? 'moderada',
    occasion: row.occasion as Perfume['occasion'],
    shortDescription: row.short_description,
    description: row.description,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    imagens: row.images,
    researchVerified: row.research_verified,
  }
}

function publicCatalogClient() {
  const { url, anonKey } = readSupabasePublicConfig()
  return createClient(url, anonKey, { auth: { persistSession: false } })
}

/** All published (active) products. Memoized per request. */
export const getAllPerfumes = cache(async (): Promise<Perfume[]> => {
  try {
    const supabase = publicCatalogClient()
    const { data, error } = await supabase
      .from('products')
      .select(CATALOG_COLUMNS)
      .eq('active', true)
      .order('created_at', { ascending: false })
    if (error || !data) return []
    return (data as unknown as ProductRow[]).map(toPerfume)
  } catch {
    return []
  }
})

export async function getPerfumeBySlug(slug: string): Promise<Perfume | undefined> {
  const all = await getAllPerfumes()
  return all.find((p) => p.slug === slug)
}

export async function getPerfumeById(id: string): Promise<Perfume | undefined> {
  const all = await getAllPerfumes()
  return all.find((p) => p.id === id)
}

/**
 * Sem dados reais de venda/lançamento ainda (loja não abriu). Estas funções
 * fazem uma curadoria determinística (não randômica) para preencher as
 * vitrines da home até existir dado real (vendas, data de cadastro no admin).
 * Prioriza produtos com ficha de pesquisa confirmada e notas olfativas,
 * e evita repetir marca dentro da mesma vitrine.
 */
function curatedDiverse(items: Perfume[], count: number, skipIds: Set<string>): Perfume[] {
  const seenMarcas = new Set<string>()
  const picked: Perfume[] = []
  const pool = items.filter((p) => p.researchVerified && p.notesTop.length > 0 && !skipIds.has(p.id))
  for (const p of pool) {
    if (seenMarcas.has(p.marca)) continue
    seenMarcas.add(p.marca)
    picked.push(p)
    if (picked.length === count) break
  }
  return picked
}

function shuffled<T>(items: readonly T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/**
 * Shared shape for the three home shelves: take the admin-tagged pool
 * (capped at `count`, randomized if she tagged more than that), then fill
 * any remaining slots from curatedDiverse so the shelf never looks sparse
 * while she's still tagging the catalog.
 */
function pickWithFallback(
  all: Perfume[],
  pool: Perfume[],
  count: number,
  skipIds: Set<string>,
): Perfume[] {
  const picked = shuffled(pool.filter((p) => !skipIds.has(p.id))).slice(0, count)
  if (picked.length === count) return picked

  const pickedIds = new Set(picked.map((p) => p.id))
  const fallback = curatedDiverse(all, count - picked.length, new Set([...skipIds, ...pickedIds]))
  return [...picked, ...fallback]
}

/**
 * "Destaque" — manual toggle on the admin product form. Memoized per request
 * (React cache()): getHomepageNewArrivals/getHomepageBestSellers call this
 * again internally to compute what to skip, and since the pick involves
 * Math.random(), memoization is what keeps the section actually rendered
 * in sync with the "already used" set the other shelves exclude.
 */
export const getHomepageFeatured = cache(async (count = 4): Promise<Perfume[]> => {
  const all = await getAllPerfumes()
  return pickWithFallback(all, all.filter((p) => p.isFeatured), count, new Set())
})

/** "Novidades" — manual toggle on the admin product form. Memoized per request, see getHomepageFeatured. */
export const getHomepageNewArrivals = cache(async (count = 8): Promise<Perfume[]> => {
  const all = await getAllPerfumes()
  const featured = await getHomepageFeatured(4)
  const skip = new Set(featured.map((p) => p.id))
  return pickWithFallback(all, all.filter((p) => p.isNew), count, skip)
})

async function getTopSellingProductIds(limit: number): Promise<string[]> {
  try {
    const supabase = createSupabaseAdmin(readCommerceConfig())
    const { data, error } = await supabase
      .from('top_selling_products')
      .select('product_id')
      .order('total_quantity', { ascending: false })
      .limit(limit)
    if (error || !data) return []
    return data.map((row: { product_id: string }) => row.product_id)
  } catch {
    return []
  }
}

/**
 * "Mais vendidos" — computed from real sales (top_selling_products, built
 * from inventory_movements SALE rows), not a manual toggle: nobody can
 * fake this from the admin panel. Empty until the store's first paid order;
 * curatedDiverse fills the shelf until then.
 */
export const getHomepageBestSellers = cache(async (count = 4): Promise<Perfume[]> => {
  const all = await getAllPerfumes()
  const featured = await getHomepageFeatured(4)
  const newArrivals = await getHomepageNewArrivals(8)
  const skip = new Set([...featured.map((p) => p.id), ...newArrivals.map((p) => p.id)])

  const topSellingIds = await getTopSellingProductIds(count + skip.size)
  const byId = new Map(all.map((p) => [p.id, p]))
  const bestSellers = topSellingIds
    .map((id) => byId.get(id))
    .filter((p): p is Perfume => p !== undefined && !skip.has(p.id))
    .slice(0, count)

  if (bestSellers.length === count) return bestSellers

  const bestSellerIds = new Set(bestSellers.map((p) => p.id))
  const fallback = curatedDiverse(all, count - bestSellers.length, new Set([...skip, ...bestSellerIds]))
  return [...bestSellers, ...fallback]
})
