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
  isFeatured: boolean
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
  imagens: string[]
  researchVerified: boolean
}

export function volumeLabel(p: Perfume): string {
  return p.volumeMl ? `${p.volumeMl}ml` : ''
}

/** Nome curto pra card (marca + nome + versão) — o titulo_site completo (SEO) é longo demais pra caber legível num card. */
export function cardTitle(p: Perfume): string {
  return `${p.marca} ${p.nome}${p.versao ? ' ' + p.versao : ''}`
}

export function primaryImage(p: Perfume): string | undefined {
  return p.imagens[0]
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
