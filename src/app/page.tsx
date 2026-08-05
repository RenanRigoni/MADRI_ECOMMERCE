import Link from 'next/link'
import Image from 'next/image'
import { Truck, ShieldCheck, Gift, MessageCircle } from 'lucide-react'
import ProductCard from '@/components/produto/ProductCard'
import CategorySection from '@/components/sections/CategorySection'
import FragranceFamilySection from '@/components/sections/FragranceFamilySection'
import FragranceFinderSection from '@/components/sections/FragranceFinderSection'
import GiftSection from '@/components/sections/GiftSection'
import HeroSearchTrigger from '@/components/hero/HeroSearchTrigger'
import HeroCarousel from '@/components/hero/HeroCarousel'
import { getAllPerfumes, getHomepageBestSellers, getHomepageNewArrivals, volumeLabel, cardTitle, primaryImage } from '@/lib/perfumes'

/* ── Hero images — mantenha 4-6 imagens para ritmo ideal ── */
const heroImages: string[] = [
  '/perfumes/perfume-1.png',
  '/perfumes/perfume-2.png',
  '/perfumes/perfume-3.png',
  '/perfumes/perfume-4.png',
  '/perfumes/perfume-6.png',
]

/* ── Typography shorthands ───────────────────────────── */
const bodyFont    = 'var(--font-body), Montserrat, sans-serif'
const displayFont = 'var(--font-display), Cormorant Garamond, Georgia, serif'

const benefits = [
  { icon: Truck,         title: 'Envio nacional',    desc: 'Correios para todo o Brasil' },
  { icon: ShieldCheck,   title: 'Pagamento seguro',  desc: 'Mercado Pago e Pix'          },
  { icon: Gift,          title: 'Embalagem premium', desc: 'Com apresentação especial'   },
  { icon: MessageCircle, title: 'Atendimento',       desc: 'Via WhatsApp'                },
]

const momentos = [
  {
    key: 'dia',
    titulo: 'Para o dia',
    descricao: 'Fragrâncias leves, frescas e vibrantes para a rotina.',
    href: '/produtos?momento=dia',
    image: '/momentos/para_dia.png',
    fallback: '#E8DEC8',
  },
  {
    key: 'noite',
    titulo: 'Para a noite',
    descricao: 'Perfumes intensos, sensuais e marcantes.',
    href: '/produtos?momento=noite',
    image: '/momentos/para_noite.png',
    fallback: '#1A0808',
  },
  {
    key: 'trabalho',
    titulo: 'Para o trabalho',
    descricao: 'Essências elegantes, discretas e sofisticadas.',
    href: '/produtos?momento=trabalho',
    image: '/momentos/para_trabalho.png',
    fallback: '#C8C4BC',
  },
  {
    key: 'encontros',
    titulo: 'Para encontros',
    descricao: 'Notas envolventes para momentos de presença.',
    href: '/produtos?momento=encontros',
    image: '/momentos/para_encontros.png',
    fallback: '#1C1008',
  },
  {
    key: 'presente',
    titulo: 'Para presentear',
    descricao: 'Escolhas especiais com embalagem premium.',
    href: '/produtos?filter=giftable',
    image: '/momentos/para_presentear.png',
    fallback: '#D4A8A0',
  },
  {
    key: 'especial',
    titulo: 'Ocasiões especiais',
    descricao: 'Fragrâncias memoráveis para momentos únicos.',
    href: '/produtos?momento=especial',
    image: '/momentos/ocasioes_especiais.png',
    fallback: '#1A1428',
  },
]

/* ── Page ──────────────────────────────────────────────── */
export const revalidate = 3600

export default async function Home() {
  /* Curadoria automática (sem dado real de vendas/lançamento ainda) — ver getHomepageBestSellers/getHomepageNewArrivals em lib/perfumes.ts */
  const maisVendidos = await getHomepageBestSellers(4)
  const novidades = await getHomepageNewArrivals(8)
  const allPerfumes = await getAllPerfumes()

  return (
    <>
      {/* ━━━ 1. HERO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative bg-[#FAF6F0] overflow-hidden min-h-[520px] md:min-h-[600px]">

        {/* Faint "M" watermark — só aparece sem imagens */}
        {heroImages.length === 0 && (
          <div
            aria-hidden
            className="pointer-events-none select-none absolute right-[-40px] top-1/2 -translate-y-1/2 leading-none"
            style={{
              fontFamily: displayFont,
              fontWeight: 500,
              fontSize: 'clamp(280px, 36vw, 520px)',
              color: '#C4A55C',
              opacity: 0.055,
              letterSpacing: '-0.02em',
            }}
          >
            M
          </div>
        )}

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">

            {/* Left — copy */}
            <div className="flex flex-col gap-6 animate-fade-up">

              {/* Eyebrow */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-px bg-[#C4A55C]" aria-hidden />
                <p
                  className="text-[10px] tracking-[0.4em] uppercase text-[#C4A55C] font-medium"
                  style={{ fontFamily: bodyFont }}
                >
                  Coleção exclusiva
                </p>
              </div>

              {/* Heading */}
              <h1
                className="text-[52px] sm:text-[64px] lg:text-[80px] leading-[0.93] tracking-tight text-[#0A0A0A]"
                style={{ fontFamily: displayFont, fontWeight: 500 }}
              >
                A essência<br />
                <span style={{ color: '#C4A55C' }}>do seu</span><br />
                momento.
              </h1>

              {/* Body */}
              <p
                className="text-sm leading-relaxed text-[#6B7280] max-w-xs"
                style={{ fontFamily: bodyFont, fontWeight: 400 }}
              >
                Perfumes que contam histórias, criados para quem vive com intenção.
              </p>

              {/* Search bar */}
              <HeroSearchTrigger />

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 pt-1 animate-fade-up-delay-2">
                <Link
                  href="/produtos"
                  className="cursor-pointer inline-flex items-center justify-center px-8 py-4 bg-[#0A0A0A] text-white text-[11px] tracking-[0.25em] uppercase font-medium hover:bg-[#C4A55C] active:scale-[0.98] transition-all duration-300"
                  style={{ fontFamily: bodyFont }}
                >
                  Comprar agora
                </Link>
                <Link
                  href="#finder"
                  className="cursor-pointer inline-flex items-center justify-center px-8 py-4 border border-[#0A0A0A] text-[#0A0A0A] text-[11px] tracking-[0.25em] uppercase font-medium hover:bg-[#0A0A0A] hover:text-white active:scale-[0.98] transition-all duration-300"
                  style={{ fontFamily: bodyFont }}
                >
                  Encontrar meu perfume
                </Link>
              </div>

            </div>

            {/* Right — carousel de produtos */}
            {heroImages.length > 0 && (
              <div className="hidden md:flex items-center justify-center relative" style={{ minHeight: '460px' }}>
                {/* Decorative oval */}
                <div
                  aria-hidden
                  className="absolute inset-x-8 inset-y-0 rounded-full pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse 70% 80% at 50% 55%, rgba(196,165,92,0.07) 0%, transparent 70%)' }}
                />
                <HeroCarousel images={heroImages} />
              </div>
            )}

          </div>
        </div>
      </section>

      {/* ━━━ 2. BENEFITS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="border-y border-[#E8E0D4] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 md:divide-x divide-[#E8E0D4]">
            {benefits.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex flex-col sm:flex-row items-center sm:items-start gap-3 py-5 px-4 md:px-6 text-center sm:text-left"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#FAF6F0] flex items-center justify-center">
                  <Icon size={15} strokeWidth={1.25} className="text-[#C4A55C]" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-[#0A0A0A] mb-0.5" style={{ fontFamily: bodyFont }}>
                    {title}
                  </p>
                  <p className="text-[11px] text-[#9CA3AF] leading-snug" style={{ fontFamily: bodyFont }}>
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ 3. SHOP BY CATEGORY ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <CategorySection />

      {/* ━━━ 4. MAIS VENDIDOS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="bg-white py-10 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="mb-6 md:mb-12">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-10 h-px bg-[#C4A55C]" aria-hidden />
              <p
                className="text-[10px] tracking-[0.4em] uppercase text-[#C4A55C] font-medium"
                style={{ fontFamily: bodyFont }}
              >
                Os favoritos
              </p>
            </div>
            <div className="flex items-end justify-between">
              <h2
                className="text-3xl md:text-5xl text-[#0A0A0A]"
                style={{ fontFamily: displayFont, fontWeight: 500 }}
              >
                Mais vendidos
              </h2>
              <Link
                href="/produtos?sort=mais-vendidos"
                className="cursor-pointer hidden sm:inline text-[10px] tracking-[0.2em] uppercase text-[#4A4A4A] border-b border-[#E8E0D4] pb-0.5 hover:text-[#C4A55C] hover:border-[#C4A55C] transition-colors"
                style={{ fontFamily: bodyFont, fontWeight: 500 }}
              >
                Ver mais vendidos
              </Link>
            </div>
          </div>

          {maisVendidos.length > 0 && (
            <>
              {/* Featured first */}
              <div className="mb-4 md:mb-5">
                <ProductCard
                  id={maisVendidos[0].id}
                  slug={maisVendidos[0].slug}
                  name={cardTitle(maisVendidos[0])}
                  imageUrl={primaryImage(maisVendidos[0])}
                  volume={volumeLabel(maisVendidos[0])}
                  price={maisVendidos[0].price}
                  discount={maisVendidos[0].discount ?? undefined}
                  stock={maisVendidos[0].stock}
                  featured
                  fragranceFamily={maisVendidos[0].fragranceFamily}
                  notesTop={maisVendidos[0].notesTop}
                  shortDescription={maisVendidos[0].shortDescription ?? undefined}
                />
              </div>

              {/* Remaining 3 */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
                {maisVendidos.slice(1).map((p) => (
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
                    fragranceFamily={p.fragranceFamily}
                    notesTop={p.notesTop}
                    shortDescription={p.shortDescription ?? undefined}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ━━━ 5. FAMÍLIAS OLFATIVAS ━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <FragranceFamilySection />

      {/* ━━━ 6. FRAGRANCE FINDER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div id="finder">
        <FragranceFinderSection perfumes={allPerfumes} />
      </div>

      {/* ━━━ 7. ESCOLHA PELO SEU MOMENTO ━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="bg-[#FAF6F0] py-12 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="mb-8 md:mb-12">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-10 h-px bg-[#C4A55C]" aria-hidden />
              <p
                className="text-[10px] tracking-[0.4em] uppercase text-[#C4A55C] font-medium"
                style={{ fontFamily: bodyFont }}
              >
                Navegue por ocasião
              </p>
            </div>
            <h2
              className="text-3xl md:text-5xl text-[#0A0A0A]"
              style={{ fontFamily: displayFont, fontWeight: 500 }}
            >
              Escolha pelo seu momento
            </h2>
          </div>

          {/* Editorial grid — 1 col mobile, 3 col desktop */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5">
            {momentos.map((m) => (
              <Link
                key={m.key}
                href={m.href}
                className="group relative overflow-hidden rounded-2xl cursor-pointer aspect-[5/3] md:aspect-[4/5] block"
              >
                {/* Fallback bg */}
                <div className="absolute inset-0" style={{ background: m.fallback }} />

                {/* Editorial image */}
                <Image
                  src={m.image}
                  alt={m.titulo}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/5 group-hover:from-black/88 transition-all duration-500" />

                {/* Gold top shimmer on hover */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C4A55C]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Content — bottom-left */}
                <div className="absolute inset-x-0 bottom-0 p-4 md:p-6 translate-y-1 group-hover:translate-y-0 transition-transform duration-400">
                  <h3
                    className="text-xl md:text-2xl text-white leading-tight mb-1"
                    style={{ fontFamily: displayFont, fontWeight: 500 }}
                  >
                    {m.titulo}
                  </h3>
                  <p
                    className="text-[10px] md:text-[11px] text-white/60 leading-snug mb-3 md:mb-4"
                    style={{ fontFamily: bodyFont }}
                  >
                    {m.descricao}
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[9px] tracking-[0.3em] uppercase text-[#C4A55C] font-medium"
                      style={{ fontFamily: bodyFont }}
                    >
                      Ver fragrâncias
                    </span>
                    <span
                      className="inline-block w-4 h-px bg-[#C4A55C] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-400"
                      aria-hidden
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ 8. NOVIDADES — horizontal scroll carousel ━━━━━━━━ */}
      <section className="bg-white py-10 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex items-end justify-between mb-7 md:mb-12">
            <div>
              <p
                className="text-[10px] tracking-[0.35em] uppercase text-[#C4A55C] font-medium mb-2"
                style={{ fontFamily: bodyFont }}
              >
                Acabou de chegar
              </p>
              <h2
                className="text-3xl md:text-5xl text-[#0A0A0A]"
                style={{ fontFamily: displayFont, fontWeight: 500 }}
              >
                Novidades
              </h2>
            </div>
            <Link
              href="/produtos?filter=novo"
              className="cursor-pointer text-[10px] tracking-[0.2em] uppercase text-[#4A4A4A] border-b border-[#E8E0D4] pb-0.5 hover:text-[#C4A55C] hover:border-[#C4A55C] transition-colors flex-shrink-0 ml-4"
              style={{ fontFamily: bodyFont, fontWeight: 500 }}
            >
              Ver todas
            </Link>
          </div>

          {/* ── Mobile: real swipeable carousel (breakout) ─────── */}
          <div className="md:hidden -mx-4 px-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth pb-4">
            <div className="flex gap-3 w-max">
              {novidades.map((p) => (
                <div key={p.id} className="snap-start w-[76vw] max-w-[280px] flex-shrink-0">
                  <ProductCard
                    id={p.id}
                    slug={p.slug}
                    name={cardTitle(p)}
                    imageUrl={primaryImage(p)}
                    volume={volumeLabel(p)}
                    price={p.price}
                    discount={p.discount ?? undefined}
                    stock={p.stock}
                    isNew
                    fragranceFamily={p.fragranceFamily}
                    notesTop={p.notesTop}
                  />
                </div>
              ))}
              {/* trailing spacer so last card doesn't hug the edge */}
              <div className="w-4 flex-shrink-0" aria-hidden />
            </div>
          </div>

          {/* ── Desktop: 4-col grid ────────────────────────────── */}
          <div className="hidden md:grid md:grid-cols-4 gap-4">
            {novidades.map((p) => (
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
                isNew
                fragranceFamily={p.fragranceFamily}
                notesTop={p.notesTop}
              />
            ))}
          </div>

          {/* Mobile see-all */}
          <div className="mt-5 text-center md:hidden">
            <Link
              href="/produtos?filter=novo"
              className="cursor-pointer inline-flex items-center justify-center px-8 py-3 border border-[#E8E0D4] text-[10px] tracking-[0.2em] uppercase text-[#4A4A4A] hover:border-[#0A0A0A] hover:text-[#0A0A0A] transition-colors"
              style={{ fontFamily: bodyFont, fontWeight: 500 }}
            >
              Ver todas as novidades
            </Link>
          </div>
        </div>
      </section>

      {/* ━━━ 9. PRESENTES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <GiftSection />

      {/* ━━━ 10. BRAND STATEMENT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative bg-[#0A0A0A] py-28 md:py-40 overflow-hidden">

        <div
          aria-hidden
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(to right, transparent, rgba(196,165,92,0.40) 40%, rgba(196,165,92,0.40) 60%, transparent)' }}
        />
        <div
          aria-hidden
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
          style={{
            width: '600px', height: '600px',
            background: 'radial-gradient(circle, rgba(196,165,92,0.04) 0%, transparent 65%)',
          }}
        />

        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center gap-8">

          <div className="flex items-center gap-4">
            <div className="w-16 h-px" style={{ background: 'rgba(196,165,92,0.30)' }} aria-hidden />
            <div aria-hidden className="w-1.5 h-1.5 rotate-45 bg-[#C4A55C]" style={{ opacity: 0.55 }} />
            <div className="w-16 h-px" style={{ background: 'rgba(196,165,92,0.30)' }} aria-hidden />
          </div>

          <p
            className="text-[10px] tracking-[0.4em] uppercase font-medium"
            style={{ fontFamily: bodyFont, color: 'rgba(196,165,92,0.60)' }}
          >
            Nossa essência
          </p>

          <h2
            className="text-4xl sm:text-5xl md:text-6xl text-white leading-[1.05]"
            style={{ fontFamily: displayFont, fontWeight: 500 }}
          >
            Cada frasco carrega<br />
            <span style={{ color: '#C4A55C', fontStyle: 'italic' }}>uma intenção</span>.
          </h2>

          <p
            className="text-sm leading-relaxed max-w-md"
            style={{ fontFamily: bodyFont, fontWeight: 400, color: '#9CA3AF' }}
          >
            A MADRI cria fragrâncias exclusivas para transformar momentos em presença,
            memória e identidade.
          </p>

          <Link
            href="/sobre"
            className="cursor-pointer inline-flex items-center gap-2 text-[11px] tracking-[0.3em] uppercase font-medium border px-8 py-3.5 hover:bg-[#C4A55C] hover:border-[#C4A55C] hover:text-[#0A0A0A] active:scale-[0.98] transition-all duration-300"
            style={{ fontFamily: bodyFont, color: '#C4A55C', borderColor: 'rgba(196,165,92,0.35)' }}
          >
            Conheça a MADRI
          </Link>

          <div className="flex items-center gap-4">
            <div className="w-16 h-px" style={{ background: 'rgba(196,165,92,0.30)' }} aria-hidden />
            <div aria-hidden className="w-1.5 h-1.5 rotate-45 bg-[#C4A55C]" style={{ opacity: 0.55 }} />
            <div className="w-16 h-px" style={{ background: 'rgba(196,165,92,0.30)' }} aria-hidden />
          </div>
        </div>

        <div
          aria-hidden
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(to right, transparent, rgba(196,165,92,0.40) 40%, rgba(196,165,92,0.40) 60%, transparent)' }}
        />
      </section>
    </>
  )
}
