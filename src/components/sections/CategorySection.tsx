import Link from 'next/link'
import { Sparkles, Star, Gift, Users, User, UserCheck } from 'lucide-react'

const bodyFont = 'var(--font-body), Montserrat, sans-serif'
const displayFont = 'var(--font-display), Cormorant Garamond, Georgia, serif'

const categories = [
  {
    key: 'femininos',
    label: 'Femininos',
    href: '/produtos?perfil=feminino',
    Icon: User,
    desc: 'Para ela',
  },
  {
    key: 'masculinos',
    label: 'Masculinos',
    href: '/produtos?perfil=masculino',
    Icon: UserCheck,
    desc: 'Para ele',
  },
  {
    key: 'unissex',
    label: 'Unissex',
    href: '/produtos?perfil=unissex',
    Icon: Users,
    desc: 'Para todos',
  },
  {
    key: 'mais-vendidos',
    label: 'Mais vendidos',
    href: '/produtos?sort=mais-vendidos',
    Icon: Star,
    desc: 'Os favoritos',
  },
  {
    key: 'lancamentos',
    label: 'Lançamentos',
    href: '/produtos?filter=novo',
    Icon: Sparkles,
    desc: 'Recém chegados',
  },
  {
    key: 'presentes',
    label: 'Presentes',
    href: '/produtos?filter=giftable',
    Icon: Gift,
    desc: 'Com embalagem',
  },
]

export default function CategorySection() {
  return (
    <section className="bg-white border-y border-[#E8E0D4] py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex items-center justify-between mb-8">
          <h2
            className="text-2xl md:text-3xl text-[#0A0A0A]"
            style={{ fontFamily: displayFont, fontWeight: 500 }}
          >
            Compre por categoria
          </h2>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
          {categories.map(({ key, label, href, Icon, desc }) => (
            <Link
              key={key}
              href={href}
              className="cursor-pointer group flex flex-col items-center gap-3 py-5 px-3 border border-[#E8E0D4] bg-[#FAFAFA] hover:border-[#C4A55C]/50 hover:bg-white hover:shadow-[0_4px_20px_rgba(196,165,92,0.08)] transition-all duration-300 text-center"
            >
              <div className="w-10 h-10 rounded-full bg-white border border-[#E8E0D4] group-hover:border-[#C4A55C]/30 flex items-center justify-center transition-colors duration-300">
                <Icon
                  size={18}
                  strokeWidth={1.25}
                  className="text-[#9CA3AF] group-hover:text-[#C4A55C] transition-colors duration-300"
                />
              </div>
              <div>
                <p
                  className="text-[11px] font-semibold text-[#0A0A0A] group-hover:text-[#C4A55C] transition-colors leading-tight"
                  style={{ fontFamily: bodyFont, fontWeight: 600 }}
                >
                  {label}
                </p>
                <p
                  className="text-[10px] text-[#9CA3AF] mt-0.5 hidden md:block"
                  style={{ fontFamily: bodyFont }}
                >
                  {desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
