import Link from 'next/link'
import { Truck, ShieldCheck, Gift, MessageCircle } from 'lucide-react'
import ProductCard from '@/components/produto/ProductCard'
import CategorySection from '@/components/sections/CategorySection'
import FragranceFamilySection from '@/components/sections/FragranceFamilySection'
import FragranceFinderSection from '@/components/sections/FragranceFinderSection'
import GiftSection from '@/components/sections/GiftSection'
import HeroSearchTrigger from '@/components/hero/HeroSearchTrigger'
import HeroCarousel from '@/components/hero/HeroCarousel'
import { maisVendidos, novidades } from '@/lib/products'

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
    descricao: 'Fragrâncias leves, frescas e vibrantes para o cotidiano',
    href: '/produtos?momento=dia',
    bg: 'linear-gradient(150deg, #FFFBF5 0%, #F5EDD8 60%, #E8D5A8 100%)',
    textDark: true,
  },
  {
    key: 'noite',
    titulo: 'Para a noite',
    descricao: 'Intensos, sensuais e inesquecíveis para momentos especiais',
    href: '/produtos?momento=noite',
    bg: 'linear-gradient(150deg, #1C1814 0%, #110E0B 60%, #0A0A0A 100%)',
    textDark: false,
  },
  {
    key: 'encontros',
    titulo: 'Para encontros',
    descricao: 'Marcantes e sedutores para deixar uma presença duradoura',
    href: '/produtos?momento=encontros',
    bg: 'linear-gradient(150deg, #1A1018 0%, #120C10 60%, #0A0A0A 100%)',
    textDark: false,
  },
  {
    key: 'presente',
    titulo: 'Para presentear',
    descricao: 'Embalagem especial, impacto duradouro e memória afetiva',
    href: '/produtos?filter=giftable',
    bg: 'linear-gradient(150deg, #FDF4EC 0%, #F5DEBB 60%, #E8C48A 100%)',
    textDark: true,
  },
]

/* ── Page ──────────────────────────────────────────────── */
export default function Home() {
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
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[#E8E0D4]">
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
      <section className="bg-white py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="mb-10 md:mb-12">
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
                className="text-4xl md:text-5xl text-[#0A0A0A]"
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

          {/* Featured first */}
          <div className="mb-4 md:mb-5">
            <ProductCard
              {...maisVendidos[0]}
              featured
              isBestSeller={maisVendidos[0].isBestSeller}
              fragranceFamily={maisVendidos[0].fragranceFamily}
              notesTop={maisVendidos[0].notesTop}
              intensity={maisVendidos[0].intensity}
              shortDescription={maisVendidos[0].shortDescription}
            />
          </div>

          {/* Remaining 3 */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
            {maisVendidos.slice(1).map((p) => (
              <ProductCard
                key={p.id}
                id={p.id}
                slug={p.slug}
                name={p.name}
                volume={p.volume}
                price={p.price}
                discount={p.discount}
                stock={p.stock}
                fragranceFamily={p.fragranceFamily}
                notesTop={p.notesTop}
                intensity={p.intensity}
                shortDescription={p.shortDescription}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ 5. FAMÍLIAS OLFATIVAS ━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <FragranceFamilySection />

      {/* ━━━ 6. FRAGRANCE FINDER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div id="finder">
        <FragranceFinderSection />
      </div>

      {/* ━━━ 7. ESCOLHA PELO SEU MOMENTO ━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="bg-[#FAF6F0] py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center mb-12 md:mb-14">
            <p
              className="text-[10px] tracking-[0.4em] uppercase text-[#C4A55C] font-medium mb-3"
              style={{ fontFamily: bodyFont }}
            >
              Navegue por ocasião
            </p>
            <h2
              className="text-4xl md:text-5xl text-[#0A0A0A]"
              style={{ fontFamily: displayFont, fontWeight: 500 }}
            >
              Escolha pelo seu momento
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {momentos.map((m) => (
              <Link
                key={m.key}
                href={m.href}
                className="cursor-pointer group relative overflow-hidden block"
                style={{ height: '320px' }}
              >
                <div
                  className="absolute inset-0 group-hover:scale-105 transition-transform duration-700 ease-out"
                  style={{ background: m.bg }}
                  aria-hidden
                />
                <div
                  aria-hidden
                  className="absolute bottom-0 left-0 right-0 h-3/5"
                  style={{
                    background: m.textDark
                      ? 'linear-gradient(to top, rgba(240,232,220,0.8) 0%, transparent 100%)'
                      : 'linear-gradient(to top, rgba(10,10,10,0.75) 0%, transparent 100%)',
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3
                    className="text-xl md:text-2xl leading-tight mb-1.5"
                    style={{
                      fontFamily: displayFont,
                      fontWeight: 500,
                      color: m.textDark ? '#0A0A0A' : 'white',
                    }}
                  >
                    {m.titulo}
                  </h3>
                  <p
                    className="text-[11px] mb-4 leading-snug"
                    style={{
                      fontFamily: bodyFont,
                      color: m.textDark ? 'rgba(10,10,10,0.55)' : 'rgba(255,255,255,0.65)',
                    }}
                  >
                    {m.descricao}
                  </p>
                  <span
                    className="text-[9px] tracking-[0.25em] uppercase font-semibold border-b pb-0.5 transition-colors group-hover:border-opacity-100"
                    style={{
                      fontFamily: bodyFont,
                      color: '#C4A55C',
                      borderColor: 'rgba(196,165,92,0.5)',
                    }}
                  >
                    Ver fragrâncias
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ 8. NOVIDADES — horizontal scroll carousel ━━━━━━━━ */}
      <section className="bg-white py-20 md:py-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex items-end justify-between mb-10 md:mb-12">
            <div>
              <p
                className="text-[10px] tracking-[0.35em] uppercase text-[#C4A55C] font-medium mb-2"
                style={{ fontFamily: bodyFont }}
              >
                Acabou de chegar
              </p>
              <h2
                className="text-4xl md:text-5xl text-[#0A0A0A]"
                style={{ fontFamily: displayFont, fontWeight: 500 }}
              >
                Novidades
              </h2>
            </div>
            <Link
              href="/produtos?filter=novo"
              className="cursor-pointer hidden sm:inline text-[10px] tracking-[0.2em] uppercase text-[#4A4A4A] border-b border-[#E8E0D4] pb-0.5 hover:text-[#C4A55C] hover:border-[#C4A55C] transition-colors flex-shrink-0 ml-4"
              style={{ fontFamily: bodyFont, fontWeight: 500 }}
            >
              Ver todas
            </Link>
          </div>

          {/* Horizontal scroll on mobile, grid on desktop */}
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-4 md:overflow-visible md:pb-0">
            {novidades.map((p) => (
              <div key={p.id} className="flex-shrink-0 w-[260px] snap-start md:w-auto">
                <ProductCard
                  id={p.id}
                  slug={p.slug}
                  name={p.name}
                  volume={p.volume}
                  price={p.price}
                  discount={p.discount}
                  stock={p.stock}
                  isNew={p.isNew}
                  fragranceFamily={p.fragranceFamily}
                  notesTop={p.notesTop}
                  intensity={p.intensity}
                />
              </div>
            ))}
          </div>

          {/* Mobile see-all */}
          <div className="mt-6 text-center sm:hidden">
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
