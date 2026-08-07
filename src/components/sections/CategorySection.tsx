import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

const bodyFont = 'var(--font-body), Montserrat, sans-serif'

// Plain CSS background (not next/image) on purpose: these circles need a tight,
// hand-tuned crop around just the bottle, not the whole scene — background-size
// gives independent zoom control that object-fit:cover can't (cover always shows
// the full "short" axis of the source, which left too much empty background
// visible at this small size). backgroundSize is "<width>% auto" (height follows
// the source aspect ratio); backgroundPosition centers the bottle inside that zoom.
const categories = [
  {
    key: 'femininos',
    label: 'Femininos',
    href: '/produtos?perfil=feminino',
    image: '/categorias/femininos.png',
    backgroundSize: '210% auto',
    backgroundPosition: '65% 50%',
  },
  {
    key: 'masculinos',
    label: 'Masculinos',
    href: '/produtos?perfil=masculino',
    image: '/categorias/masculinos.png',
    backgroundSize: '210% auto',
    backgroundPosition: '73% 50%',
  },
  {
    key: 'unissex',
    label: 'Unissex',
    href: '/produtos?perfil=unissex',
    image: '/categorias/unissex.png',
    backgroundSize: '210% auto',
    backgroundPosition: '39% 50%',
  },
  {
    key: 'mais-vendidos',
    label: 'Mais vendidos',
    href: '/produtos?sort=mais-vendidos',
    image: '/categorias/mais-vendidos.png',
    backgroundSize: '115% auto',
    backgroundPosition: '50% 60%',
  },
  {
    key: 'lancamentos',
    label: 'Lançamentos',
    href: '/produtos?filter=novo',
    image: '/categorias/lancamentos.png',
    backgroundSize: '210% auto',
    backgroundPosition: '63% 50%',
  },
  {
    key: 'presentes',
    label: 'Presentes',
    href: '/produtos?filter=giftable',
    image: '/categorias/presentes.png',
    backgroundSize: '180% auto',
    backgroundPosition: '86% 50%',
  },
]

function CategoryItem({ cat, circleSize }: { cat: (typeof categories)[number]; circleSize: number }) {
  return (
    <Link
      href={cat.href}
      className="group flex flex-shrink-0 items-center gap-3 snap-start"
    >
      <span
        className="relative flex-shrink-0 rounded-full overflow-hidden border border-[#E8E0D4] group-hover:border-[#C4A55C]/60 transition-colors duration-300"
        style={{ width: circleSize, height: circleSize }}
      >
        <span
          className="absolute inset-0 scale-100 group-hover:scale-[1.12] transition-transform duration-500 ease-out"
          style={{
            backgroundImage: `url(${cat.image})`,
            backgroundSize: cat.backgroundSize,
            backgroundPosition: cat.backgroundPosition,
            backgroundRepeat: 'no-repeat',
          }}
        />
      </span>
      <span
        className="flex items-center gap-1 text-[11px] tracking-[0.15em] uppercase whitespace-nowrap"
        style={{ fontFamily: bodyFont, fontWeight: 500 }}
      >
        <span className="text-[#0A0A0A] group-hover:text-[#8A6A2F] transition-colors duration-300">
          {cat.label}
        </span>
        <ChevronRight
          size={13}
          strokeWidth={1.75}
          className="text-[#B8B0A5] group-hover:text-[#8A6A2F] group-hover:translate-x-0.5 transition-all duration-300"
        />
      </span>
    </Link>
  )
}

export default function CategorySection() {
  return (
    <section className="bg-[#FAF6F0] border-y border-[#E8E0D4] py-8 md:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p
          className="text-[10px] tracking-[0.4em] uppercase text-[#8A6A2F] font-medium mb-5 md:mb-6 md:text-center"
          style={{ fontFamily: bodyFont }}
        >
          Compre por categoria
        </p>

        {/* Single horizontal strip — scrolls if it doesn't fit, never wraps to a second line.
            Deliberately left-aligned (justify-start), never justify-center: centering an
            overflowing flex row makes browsers clamp scrollLeft above 0, which permanently
            clips the first item behind the left edge with no way to scroll back to it. */}
        <div className="flex items-center gap-6 md:gap-8 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth -mx-4 px-4 md:mx-0 md:px-0">
          {categories.map((cat) => (
            <CategoryItem key={cat.key} cat={cat} circleSize={56} />
          ))}
        </div>
      </div>
    </section>
  )
}
