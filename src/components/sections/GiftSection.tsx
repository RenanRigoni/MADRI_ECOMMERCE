import Link from 'next/link'
import { Gift, Package, Ribbon, Sparkles } from 'lucide-react'

const bodyFont = 'var(--font-body), Montserrat, sans-serif'
const displayFont = 'var(--font-display), Cormorant Garamond, Georgia, serif'

const pillars = [
  {
    Icon: Package,
    title: 'Embalagem especial',
    desc: 'Cada pedido é entregue com embalagem premium, pronta para presentear.',
  },
  {
    Icon: Ribbon,
    title: 'Mensagem personalizada',
    desc: 'Adicione uma mensagem exclusiva para tornar o presente ainda mais especial.',
  },
  {
    Icon: Sparkles,
    title: 'Fragrâncias presenteáveis',
    desc: 'Seleção curada de perfumes ideais para qualquer ocasião.',
  },
]

export default function GiftSection() {
  return (
    <section className="bg-[#FAF6F0] py-20 md:py-28 border-t border-[#E8E0D4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">

          {/* Left — copy */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-px bg-[#C4A55C]" aria-hidden />
              <p
                className="text-[10px] tracking-[0.4em] uppercase text-[#8A6A2F] font-medium"
                style={{ fontFamily: bodyFont }}
              >
                Para presentear
              </p>
            </div>

            <h2
              className="text-4xl md:text-5xl leading-tight text-[#0A0A0A]"
              style={{ fontFamily: displayFont, fontWeight: 500 }}
            >
              Presenteie<br />
              <span style={{ color: '#8A6A2F' }}>com intenção</span>
            </h2>

            <p className="text-sm text-[#6B7280] leading-relaxed max-w-sm" style={{ fontFamily: bodyFont }}>
              Fragrâncias com embalagem especial para transformar o momento da entrega em uma experiência memorável.
            </p>

            <div className="flex flex-col gap-5 mt-2">
              {pillars.map(({ Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-full bg-white border border-[#E8E0D4] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon size={16} strokeWidth={1.25} className="text-[#8A6A2F]" />
                  </div>
                  <div>
                    <p
                      className="text-[12px] font-semibold text-[#0A0A0A] mb-0.5"
                      style={{ fontFamily: bodyFont }}
                    >
                      {title}
                    </p>
                    <p className="text-[12px] text-[#6B7280] leading-relaxed" style={{ fontFamily: bodyFont }}>
                      {desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/produtos?filter=giftable"
              className="cursor-pointer mt-2 inline-flex items-center gap-2 w-fit px-8 py-4 bg-[#0A0A0A] text-white text-[10px] tracking-[0.25em] uppercase font-medium hover:bg-[#C4A55C] hover:text-[#0A0A0A] active:scale-[0.98] transition-all duration-300"
              style={{ fontFamily: bodyFont }}
            >
              <Gift size={14} strokeWidth={1.5} />
              Ver opções para presente
            </Link>
          </div>

          {/* Right — visual */}
          <div className="relative">
            <div className="aspect-[4/5] bg-white border border-[#E8E0D4] flex flex-col items-center justify-center gap-6 p-10">

              {/* Decorative top */}
              <div className="absolute top-6 left-6 right-6 flex items-center gap-3">
                <div className="flex-1 h-px bg-[#E8E0D4]" />
                <div className="w-1.5 h-1.5 rotate-45 bg-[#C4A55C]/50" />
                <div className="flex-1 h-px bg-[#E8E0D4]" />
              </div>

              {/* Centered content */}
              <div className="flex flex-col items-center gap-5 text-center">
                <div className="w-16 h-16 rounded-full bg-[#FAF6F0] border border-[#E8E0D4] flex items-center justify-center">
                  <Gift size={26} strokeWidth={1} className="text-[#8A6A2F]" />
                </div>
                <div>
                  <p
                    className="text-3xl md:text-4xl text-[#0A0A0A] mb-2"
                    style={{ fontFamily: displayFont, fontWeight: 500 }}
                  >
                    Embalagem<br />premium
                  </p>
                  <p className="text-[12px] text-[#6B7280]" style={{ fontFamily: bodyFont }}>
                    em cada pedido
                  </p>
                </div>

                {/* Fake price tags */}
                <div className="flex flex-col gap-2 w-full max-w-[180px]">
                  {['Até R$ 150', 'Até R$ 250', 'Kits especiais'].map((label) => (
                    <Link
                      key={label}
                      href={`/produtos?filter=giftable`}
                      className="cursor-pointer border border-[#E8E0D4] bg-[#FAFAFA] hover:border-[#C4A55C]/40 hover:bg-white py-2 px-4 text-[11px] text-[#4A4A4A] hover:text-[#0A0A0A] transition-all duration-200 text-center"
                      style={{ fontFamily: bodyFont }}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Decorative bottom */}
              <div className="absolute bottom-6 left-6 right-6 flex items-center gap-3">
                <div className="flex-1 h-px bg-[#E8E0D4]" />
                <div className="w-1.5 h-1.5 rotate-45 bg-[#C4A55C]/50" />
                <div className="flex-1 h-px bg-[#E8E0D4]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
