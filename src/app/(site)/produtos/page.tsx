import type { Metadata } from 'next'
import ProductCard from '@/components/produto/ProductCard'
import { getAllPerfumes, filterPerfumes, volumeLabel, cardTitle, primaryImage } from '@/lib/perfumes'
import { familyLabels, type FragranceFamily } from '@/lib/products'

export const metadata: Metadata = {
  title: 'Catálogo de Perfumes',
  description: 'Explore toda a coleção de fragrâncias MADRI: femininos, masculinos e unissex.',
}

export const revalidate = 3600

const bodyFont = 'var(--font-body), Montserrat, sans-serif'
const displayFont = 'var(--font-display), Cormorant Garamond, Georgia, serif'

interface SearchParams {
  familia?: string
  perfil?: string
  momento?: string
  volume?: string
  tipo?: string
  marca?: string
  q?: string
}

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const all = await getAllPerfumes()
  const filtered = filterPerfumes(all, params)

  const activeLabel = params.familia
    ? familyLabels[params.familia as FragranceFamily]
    : params.perfil
    ? { feminino: 'Femininos', masculino: 'Masculinos', unissex: 'Unissex' }[params.perfil]
    : params.momento
    ? params.momento
    : null

  return (
    <div className="bg-white">
      <section className="border-b border-[#E8E0D4] bg-[#FAF6F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-px bg-[#C4A55C]" aria-hidden />
            <p
              className="text-[10px] tracking-[0.4em] uppercase text-[#C4A55C] font-medium"
              style={{ fontFamily: bodyFont }}
            >
              Coleção completa
            </p>
          </div>
          <h1
            className="text-3xl md:text-5xl text-[#0A0A0A]"
            style={{ fontFamily: displayFont, fontWeight: 500 }}
          >
            {activeLabel ?? 'Todos os perfumes'}
          </h1>
          <p className="mt-3 text-sm text-[#6B7280]" style={{ fontFamily: bodyFont }}>
            {filtered.length} {filtered.length === 1 ? 'fragrância encontrada' : 'fragrâncias encontradas'}
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-sm text-[#6B7280]" style={{ fontFamily: bodyFont }}>
              Nenhum produto encontrado para este filtro.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {filtered.map((p) => (
              <ProductCard
                key={p.id}
                id={p.id}
                slug={p.slug}
                name={cardTitle(p)}
                imageUrl={primaryImage(p)}
                volume={volumeLabel(p)}
                price={p.price}
                discount={p.discount ?? undefined}
                stock={p.stock}
                isNew={p.isNew}
                isBestSeller={p.isBestSeller}
                fragranceFamily={p.fragranceFamily}
                notesTop={p.notesTop}
                shortDescription={p.shortDescription ?? undefined}
                profile={p.genero}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
