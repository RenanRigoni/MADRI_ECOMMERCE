import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import ProductGallery from '@/components/produto/ProductGallery'
import ProductInfo from '@/components/produto/ProductInfo'
import ProductCard from '@/components/produto/ProductCard'
import { getAllPerfumes, getPerfumeBySlug, volumeLabel, cardTitle } from '@/lib/perfumes'

const bodyFont = 'var(--font-body), Montserrat, sans-serif'

export function generateStaticParams() {
  return getAllPerfumes().map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const perfume = getPerfumeBySlug(slug)
  if (!perfume) return {}

  return {
    title: perfume.metaTitle ?? perfume.name,
    description: perfume.metaDescription ?? perfume.shortDescription ?? undefined,
    openGraph: {
      title: perfume.metaTitle ?? perfume.name,
      description: perfume.metaDescription ?? perfume.shortDescription ?? undefined,
    },
  }
}

export default async function ProdutoPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const perfume = getPerfumeBySlug(slug)

  if (!perfume) {
    notFound()
  }

  const related = getAllPerfumes()
    .filter((p) => p.marca === perfume.marca && p.id !== perfume.id)
    .slice(0, 4)

  return (
    <div className="bg-white">
      {/* Breadcrumb */}
      <div className="border-b border-[#E8E0D4] bg-[#FAF6F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-1.5 text-[11px]" style={{ fontFamily: bodyFont }}>
            <Link href="/" className="text-[#9CA3AF] hover:text-[#C4A55C] transition-colors">
              Início
            </Link>
            <ChevronRight size={11} className="text-[#D4CCBE]" />
            <Link href="/produtos" className="text-[#9CA3AF] hover:text-[#C4A55C] transition-colors">
              Produtos
            </Link>
            <ChevronRight size={11} className="text-[#D4CCBE]" />
            <span className="text-[#4A4A4A]">{perfume.name}</span>
          </nav>
        </div>
      </div>

      {/* Main */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16">
          <ProductGallery name={perfume.name} />
          <ProductInfo perfume={perfume} />
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="bg-[#FAF6F0] py-10 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2
              className="text-2xl md:text-3xl text-[#0A0A0A] mb-6"
              style={{ fontFamily: 'var(--font-display), Cormorant Garamond, Georgia, serif', fontWeight: 500 }}
            >
              Mais de {perfume.marca}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
              {related.map((p) => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  slug={p.slug}
                  name={cardTitle(p)}
                  volume={volumeLabel(p)}
                  price={p.price}
                  stock={p.stock}
                  fragranceFamily={p.fragranceFamily}
                  notesTop={p.notesTop}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
