import Link from 'next/link'
import Image from 'next/image'

const bodyFont = 'var(--font-body), Montserrat, sans-serif'
const displayFont = 'var(--font-display), Cormorant Garamond, Georgia, serif'

const families = [
  {
    key: 'floral',
    label: 'Floral',
    desc: 'Delicado, elegante e envolvente',
    href: '/produtos?familia=floral',
    image: 'https://images.unsplash.com/photo-1708265500552-c256df13d3ca?auto=format&fit=crop&w=800&q=80',
    fallback: '#F0E4E6',
  },
  {
    key: 'amadeirado',
    label: 'Amadeirado',
    desc: 'Sofisticado, quente e marcante',
    href: '/produtos?familia=amadeirado',
    image: 'https://images.unsplash.com/photo-1702001145743-094b0b7ead51?auto=format&fit=crop&w=800&q=80',
    fallback: '#3A200A',
  },
  {
    key: 'citrico',
    label: 'Cítrico',
    desc: 'Fresco, leve e vibrante',
    href: '/produtos?familia=citrico',
    image: 'https://images.unsplash.com/photo-1577234286642-fc512a5f8f11?auto=format&fit=crop&w=800&q=80',
    fallback: '#E8CC80',
  },
  {
    key: 'oriental',
    label: 'Oriental',
    desc: 'Intenso, sensual e memorável',
    href: '/produtos?familia=oriental',
    image: 'https://images.unsplash.com/photo-1551690935-a9e6f0a7e788?auto=format&fit=crop&w=800&q=80',
    fallback: '#2A1205',
  },
  {
    key: 'frutal',
    label: 'Frutal',
    desc: 'Doce, jovem e luminoso',
    href: '/produtos?familia=frutal',
    image: 'https://images.unsplash.com/photo-1585939268339-886c9643ee98?auto=format&fit=crop&w=800&q=80',
    fallback: '#E07840',
  },
  {
    key: 'aromatico',
    label: 'Aromático',
    desc: 'Limpo, versátil e moderno',
    href: '/produtos?familia=aromatico',
    image: 'https://images.unsplash.com/photo-1712178435871-48d630f15969?auto=format&fit=crop&w=800&q=80',
    fallback: '#5A4A7A',
  },
]

export default function FragranceFamilySection() {
  return (
    <section className="bg-[#FAF6F0] py-12 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8 md:mb-12">
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
              className="text-3xl md:text-5xl text-[#0A0A0A]"
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

        {/* Editorial grid — 3 cols desktop, 2 cols mobile */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
          {families.map(({ key, label, desc, href, image, fallback }) => (
            <Link
              key={key}
              href={href}
              className="group relative overflow-hidden rounded-2xl cursor-pointer"
              style={{ aspectRatio: '3/4' }}
            >
              {/* Fallback background color */}
              <div className="absolute inset-0" style={{ background: fallback }} />

              {/* Editorial image */}
              <Image
                src={image}
                alt={label}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
              />

              {/* Gradient overlay — deepens on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/5 group-hover:from-black/85 group-hover:via-black/35 transition-all duration-500" />

              {/* Gold shimmer — top edge accent */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C4A55C]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Text content — bottom anchored */}
              <div className="absolute inset-x-0 bottom-0 p-4 md:p-6 flex flex-col gap-1 md:gap-1.5 translate-y-1 group-hover:translate-y-0 transition-transform duration-400">
                <h3
                  className="text-xl md:text-2xl text-white leading-tight"
                  style={{ fontFamily: displayFont, fontWeight: 500 }}
                >
                  {label}
                </h3>
                <p
                  className="text-[10px] md:text-[11px] text-white/65 leading-snug tracking-wide"
                  style={{ fontFamily: bodyFont }}
                >
                  {desc}
                </p>
                <div className="mt-2 md:mt-3 flex items-center gap-1.5">
                  <span
                    className="text-[9px] tracking-[0.3em] uppercase text-[#C4A55C] font-medium"
                    style={{ fontFamily: bodyFont }}
                  >
                    Explorar
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
  )
}
