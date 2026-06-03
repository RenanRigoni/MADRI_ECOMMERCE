import Link from 'next/link'
import { familyLabels, familyDescriptions, type FragranceFamily } from '@/lib/products'

const bodyFont = 'var(--font-body), Montserrat, sans-serif'
const displayFont = 'var(--font-display), Cormorant Garamond, Georgia, serif'

const familyConfig: Record<FragranceFamily, { bg: string; accent: string }> = {
  floral:     { bg: '#FDF4F5', accent: '#D4848A' },
  amadeirado: { bg: '#FBF5EE', accent: '#B8834A' },
  citrico:    { bg: '#FAFBF0', accent: '#A0A040' },
  oriental:   { bg: '#FBF2EA', accent: '#C47840' },
  frutal:     { bg: '#FDF2EE', accent: '#D4784A' },
  aromatico:  { bg: '#EEF6F4', accent: '#4A9080' },
  gourmand:   { bg: '#FBF5EC', accent: '#C49060' },
  musk:       { bg: '#F5F2FB', accent: '#907890' },
}

const families = Object.keys(familyLabels) as FragranceFamily[]

export default function FragranceFamilySection() {
  return (
    <section className="bg-[#FAF6F0] py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-10 md:mb-12">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-10 h-px bg-[#C4A55C]" aria-hidden />
            <p
              className="text-[10px] tracking-[0.4em] uppercase text-[#C4A55C] font-medium"
              style={{ fontFamily: bodyFont }}
            >
              Descubra
            </p>
          </div>
          <div className="flex items-end justify-between">
            <h2
              className="text-4xl md:text-5xl text-[#0A0A0A]"
              style={{ fontFamily: displayFont, fontWeight: 500 }}
            >
              Escolha pela família olfativa
            </h2>
            <Link
              href="/produtos"
              className="cursor-pointer hidden sm:inline text-[10px] tracking-[0.2em] uppercase text-[#4A4A4A] border-b border-[#E8E0D4] pb-0.5 hover:text-[#C4A55C] hover:border-[#C4A55C] transition-colors"
              style={{ fontFamily: bodyFont, fontWeight: 500 }}
            >
              Ver todos
            </Link>
          </div>
        </div>

        {/* Grid 4x2 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          {families.map((family) => {
            const { bg, accent } = familyConfig[family]
            return (
              <Link
                key={family}
                href={`/produtos?familia=${family}`}
                className="cursor-pointer group relative overflow-hidden border border-[#E8E0D4] hover:border-transparent hover:shadow-[0_8px_32px_rgba(0,0,0,0.10)] transition-all duration-400 p-6 md:p-7 flex flex-col gap-3"
                style={{ background: bg, minHeight: '140px' }}
              >
                {/* Accent circle decoration */}
                <div
                  aria-hidden
                  className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-10 group-hover:opacity-20 transition-opacity duration-400"
                  style={{ background: accent }}
                />

                <h3
                  className="text-xl md:text-2xl leading-tight text-[#0A0A0A] relative z-10"
                  style={{ fontFamily: displayFont, fontWeight: 500 }}
                >
                  {familyLabels[family]}
                </h3>
                <p
                  className="text-[11px] leading-snug relative z-10"
                  style={{ fontFamily: bodyFont, color: '#6B7280' }}
                >
                  {familyDescriptions[family]}
                </p>

                <div className="mt-auto relative z-10">
                  <span
                    className="text-[9px] tracking-[0.25em] uppercase font-semibold pb-0.5 border-b transition-all duration-300"
                    style={{
                      fontFamily: bodyFont,
                      color: accent,
                      borderColor: `${accent}50`,
                    }}
                  >
                    Explorar
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
