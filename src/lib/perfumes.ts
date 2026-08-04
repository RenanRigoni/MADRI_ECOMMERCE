import perfumesData from '@/data/perfumes.json'
import type { FragranceFamily, Occasion, Profile, Intensity } from '@/lib/products'

export type TipoProduto = 'Perfume' | 'Body Splash' | 'Hidratante' | 'Perfume Mist'

export interface Perfume {
  id: string
  slug: string
  marca: string
  nome: string
  linha: string | null
  versao: string | null
  concentracao: string | null
  volumeMl: number | null
  genero: Profile
  tipoProduto: TipoProduto
  name: string
  price: number
  discount: number | null
  stock: number
  isNew: boolean
  isBestSeller: boolean
  isGiftable: boolean
  fragranceFamily: FragranceFamily
  fragranceFamilyLabel: string | null
  notesTop: string[]
  notesHeart: string[]
  notesBase: string[]
  profile: string[]
  intensity: Intensity
  occasion: Occasion[]
  shortDescription: string | null
  description: string | null
  metaTitle: string | null
  metaDescription: string | null
  confiancaIdentificacao: string | null
  pesquisaConfirmada: boolean
  observacoes: string | null
  imagePlaceholder: boolean
}

export const perfumes = perfumesData as Perfume[]

export function getAllPerfumes(): Perfume[] {
  return perfumes
}

export function getPerfumeBySlug(slug: string): Perfume | undefined {
  return perfumes.find((p) => p.slug === slug)
}

export function volumeLabel(p: Perfume): string {
  return p.volumeMl ? `${p.volumeMl}ml` : ''
}

/** Nome curto pra card (marca + nome + versão) — o titulo_site completo (SEO) é longo demais pra caber legível num card. */
export function cardTitle(p: Perfume): string {
  return `${p.marca} ${p.nome}${p.versao ? ' ' + p.versao : ''}`
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
  const pool = items.filter((p) => p.pesquisaConfirmada && p.notesTop.length > 0 && !skipIds.has(p.id))
  for (const p of pool) {
    if (seenMarcas.has(p.marca)) continue
    seenMarcas.add(p.marca)
    picked.push(p)
    if (picked.length === count) break
  }
  return picked
}

export function getHomepageNewArrivals(count = 8): Perfume[] {
  return curatedDiverse(perfumes, count, new Set())
}

export function getHomepageBestSellers(count = 4): Perfume[] {
  const skip = new Set(getHomepageNewArrivals(8).map((p) => p.id))
  return curatedDiverse(perfumes, count, skip)
}

export interface PerfumeFilters {
  familia?: string
  perfil?: string
  momento?: string
  volume?: string
  tipo?: string
  marca?: string
  q?: string
}

export function filterPerfumes(items: Perfume[], filters: PerfumeFilters): Perfume[] {
  return items.filter((p) => {
    if (filters.familia && p.fragranceFamily !== filters.familia) return false
    if (filters.perfil && p.genero !== filters.perfil) return false
    if (filters.momento && !p.occasion.includes(filters.momento as Occasion)) return false
    if (filters.volume && volumeLabel(p) !== filters.volume) return false
    if (filters.tipo && p.tipoProduto !== filters.tipo) return false
    if (filters.marca && p.marca.toLowerCase() !== filters.marca.toLowerCase()) return false
    if (filters.q) {
      const needle = filters.q.toLowerCase()
      const haystack = `${p.marca} ${p.nome} ${p.versao ?? ''}`.toLowerCase()
      if (!haystack.includes(needle)) return false
    }
    return true
  })
}
