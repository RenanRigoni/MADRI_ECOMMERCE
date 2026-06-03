import Link from 'next/link'

const bodyFont = 'var(--font-body), Montserrat, sans-serif'
const displayFont = 'var(--font-display), Cormorant Garamond, Georgia, serif'

const BottleFeminino = () => (
  <svg viewBox="0 0 80 110" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <ellipse cx="40" cy="72" rx="26" ry="34" stroke="#C4A55C" strokeWidth="0.75" opacity="0.32"/>
    <ellipse cx="40" cy="72" rx="18" ry="24" stroke="#C4A55C" strokeWidth="0.4" opacity="0.15"/>
    <path d="M28 40 C28 32 52 32 52 40" stroke="#C4A55C" strokeWidth="0.75" opacity="0.22" fill="none"/>
    <rect x="33" y="20" width="14" height="20" rx="3" stroke="#C4A55C" strokeWidth="0.75" opacity="0.2"/>
    <line x1="40" y1="10" x2="40" y2="20" stroke="#C4A55C" strokeWidth="0.75" opacity="0.18"/>
    <line x1="35" y1="10" x2="45" y2="10" stroke="#C4A55C" strokeWidth="0.75" opacity="0.16"/>
  </svg>
)

const BottleMasculino = () => (
  <svg viewBox="0 0 80 110" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect x="14" y="38" width="52" height="64" rx="2" stroke="#C4A55C" strokeWidth="0.75" opacity="0.32"/>
    <rect x="14" y="38" width="52" height="64" rx="2" stroke="#C4A55C" strokeWidth="0.4" opacity="0.1"
          transform="translate(3,3)"/>
    <rect x="26" y="20" width="28" height="18" rx="1" stroke="#C4A55C" strokeWidth="0.75" opacity="0.22"/>
    <line x1="40" y1="10" x2="40" y2="20" stroke="#C4A55C" strokeWidth="0.75" opacity="0.18"/>
    <line x1="34" y1="10" x2="46" y2="10" stroke="#C4A55C" strokeWidth="0.6" opacity="0.14"/>
  </svg>
)

const BottleUnissex = () => (
  <svg viewBox="0 0 80 110" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <path d="M18 56 C18 40 62 40 62 56 L62 88 C62 96 52 100 40 100 C28 100 18 96 18 88 Z"
          stroke="#C4A55C" strokeWidth="0.75" opacity="0.32" fill="none"/>
    <rect x="30" y="22" width="20" height="18" rx="3" stroke="#C4A55C" strokeWidth="0.75" opacity="0.22"/>
    <line x1="40" y1="12" x2="40" y2="22" stroke="#C4A55C" strokeWidth="0.75" opacity="0.18"/>
    <ellipse cx="40" cy="70" rx="14" ry="18" stroke="#C4A55C" strokeWidth="0.4" opacity="0.12"/>
  </svg>
)

const BottleMaisVendidos = () => (
  <svg viewBox="0 0 80 110" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect x="18" y="36" width="44" height="62" rx="3" stroke="#C4A55C" strokeWidth="0.75" opacity="0.32"/>
    <rect x="28" y="20" width="24" height="16" rx="2" stroke="#C4A55C" strokeWidth="0.75" opacity="0.22"/>
    <line x1="40" y1="12" x2="40" y2="20" stroke="#C4A55C" strokeWidth="0.75" opacity="0.18"/>
    <path d="M40 50 L42 56 L48 56 L43.5 59.5 L45.5 65.5 L40 62 L34.5 65.5 L36.5 59.5 L32 56 L38 56 Z"
          stroke="#C4A55C" strokeWidth="0.65" opacity="0.28" fill="none"/>
  </svg>
)

const BottleLancamentos = () => (
  <svg viewBox="0 0 80 110" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <path d="M20 58 C20 42 60 42 60 58 L60 86 C60 94 52 98 40 98 C28 98 20 94 20 86 Z"
          stroke="#C4A55C" strokeWidth="0.75" opacity="0.32" fill="none"/>
    <rect x="31" y="26" width="18" height="16" rx="2" stroke="#C4A55C" strokeWidth="0.75" opacity="0.22"/>
    <line x1="40" y1="18" x2="40" y2="26" stroke="#C4A55C" strokeWidth="0.75" opacity="0.18"/>
    <line x1="40" y1="10" x2="40" y2="5" stroke="#C4A55C" strokeWidth="0.65" opacity="0.22"/>
    <line x1="34" y1="13" x2="30" y2="8" stroke="#C4A55C" strokeWidth="0.6" opacity="0.18"/>
    <line x1="46" y1="13" x2="50" y2="8" stroke="#C4A55C" strokeWidth="0.6" opacity="0.18"/>
    <line x1="29" y1="18" x2="24" y2="16" stroke="#C4A55C" strokeWidth="0.5" opacity="0.13"/>
    <line x1="51" y1="18" x2="56" y2="16" stroke="#C4A55C" strokeWidth="0.5" opacity="0.13"/>
  </svg>
)

const BottlePresentes = () => (
  <svg viewBox="0 0 80 110" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect x="16" y="38" width="48" height="60" rx="3" stroke="#C4A55C" strokeWidth="0.75" opacity="0.32"/>
    <rect x="28" y="22" width="24" height="16" rx="2" stroke="#C4A55C" strokeWidth="0.75" opacity="0.22"/>
    <line x1="40" y1="14" x2="40" y2="22" stroke="#C4A55C" strokeWidth="0.75" opacity="0.18"/>
    <line x1="16" y1="60" x2="64" y2="60" stroke="#C4A55C" strokeWidth="0.65" opacity="0.22"/>
    <path d="M40 52 C36 47 29 47 31 52 C33 57 40 52 40 52 C40 52 47 57 49 52 C51 47 44 47 40 52 Z"
          stroke="#C4A55C" strokeWidth="0.65" opacity="0.26" fill="none"/>
    <line x1="40" y1="52" x2="40" y2="60" stroke="#C4A55C" strokeWidth="0.5" opacity="0.18"/>
  </svg>
)

const accents = {
  femininos: <BottleFeminino />,
  masculinos: <BottleMasculino />,
  unissex: <BottleUnissex />,
  'mais-vendidos': <BottleMaisVendidos />,
  lancamentos: <BottleLancamentos />,
  presentes: <BottlePresentes />,
}

const categories = [
  {
    key: 'femininos',
    label: 'Femininos',
    href: '/produtos?perfil=feminino',
    micro: 'Fragrâncias delicadas, marcantes e elegantes',
  },
  {
    key: 'masculinos',
    label: 'Masculinos',
    href: '/produtos?perfil=masculino',
    micro: 'Perfumes intensos, modernos e sofisticados',
  },
  {
    key: 'unissex',
    label: 'Unissex',
    href: '/produtos?perfil=unissex',
    micro: 'Essências versáteis para todos os estilos',
  },
  {
    key: 'mais-vendidos',
    label: 'Mais vendidos',
    href: '/produtos?sort=mais-vendidos',
    micro: 'Os favoritos da MADRI',
  },
  {
    key: 'lancamentos',
    label: 'Lançamentos',
    href: '/produtos?filter=novo',
    micro: 'Novas fragrâncias para descobrir',
  },
  {
    key: 'presentes',
    label: 'Presentes',
    href: '/produtos?filter=giftable',
    micro: 'Escolhas especiais para surpreender',
  },
]

export default function CategorySection() {
  return (
    <section className="bg-[#FAF8F5] border-y border-[#EDE8DE] py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <h2
          className="text-2xl md:text-3xl text-[#0A0A0A] mb-8 md:mb-10"
          style={{ fontFamily: displayFont, fontWeight: 500 }}
        >
          Compre por categoria
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
          {categories.map(({ key, label, href, micro }) => (
            <Link
              key={key}
              href={href}
              className="group relative overflow-hidden rounded-2xl border border-[#EDE8DE] bg-white
                         hover:border-[#C4A55C]/55 hover:shadow-[0_8px_36px_rgba(196,165,92,0.11)]
                         hover:-translate-y-1 transition-all duration-300 cursor-pointer
                         flex flex-col justify-end
                         px-5 pt-4 pb-5 md:px-7 md:pt-5 md:pb-7
                         min-h-[160px] md:min-h-[210px]"
            >
              {/* Bottle silhouette — top-right ghost accent */}
              <div className="absolute top-0 right-0 w-20 h-24 md:w-28 md:h-32 pointer-events-none select-none">
                {accents[key as keyof typeof accents]}
              </div>

              {/* Gold shimmer line on hover — bottom edge */}
              <div
                className="absolute bottom-0 left-6 right-6 h-px
                            bg-gradient-to-r from-transparent via-[#C4A55C] to-transparent
                            opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              />

              {/* Text content — anchored to bottom */}
              <div className="relative z-10">
                <h3
                  className="text-[1.35rem] md:text-[1.6rem] leading-tight text-[#0A0A0A]
                             group-hover:text-[#B8963E] transition-colors duration-300 mb-1"
                  style={{ fontFamily: displayFont, fontWeight: 500 }}
                >
                  {label}
                </h3>
                <p
                  className="text-[9.5px] md:text-[10.5px] text-[#A8A09A] leading-snug tracking-wide"
                  style={{ fontFamily: bodyFont }}
                >
                  {micro}
                </p>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  )
}
