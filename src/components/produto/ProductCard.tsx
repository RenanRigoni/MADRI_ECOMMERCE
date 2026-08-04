'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Heart } from 'lucide-react'
import { familyLabels, intensityLabel, type FragranceFamily, type Intensity } from '@/lib/products'

export interface ProductCardProps {
  id: string
  slug: string
  name: string
  volume: string
  price: number
  imageUrl?: string
  isNew?: boolean
  isBestSeller?: boolean
  discount?: number
  stock?: number
  featured?: boolean
  fragranceFamily?: FragranceFamily
  notesTop?: string[]
  intensity?: Intensity
  shortDescription?: string
  profile?: string
}

function formatPrice(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const bodyFont = 'var(--font-body), Montserrat, sans-serif'
const displayFont = 'var(--font-display), Cormorant Garamond, Georgia, serif'

const familyColors: Record<FragranceFamily, string> = {
  floral: '#E8B4B8',
  amadeirado: '#C4955A',
  citrico: '#C4B85A',
  oriental: '#B87A4A',
  frutal: '#E8946A',
  aromatico: '#8AB4A8',
  gourmand: '#D4A88A',
  musk: '#B4A8C4',
}

function IntensityDots({ intensity }: { intensity: Intensity }) {
  const level = intensity === 'leve' ? 1 : intensity === 'moderada' ? 2 : 3
  return (
    <div className="flex items-center gap-1" title={intensityLabel[intensity]}>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: i <= level ? '#C4A55C' : '#E8E0D4' }}
        />
      ))}
    </div>
  )
}

function CardPlaceholder({ large = false }: { large?: boolean }) {
  return (
    <div className="w-full h-full flex items-center justify-center opacity-[0.12]">
      <Image
        src="/logos/MADRI.svg"
        alt=""
        width={large ? 52 : 36}
        height={large ? 52 : 36}
        className={large ? 'w-[52px] h-[52px]' : 'w-[36px] h-[36px]'}
      />
    </div>
  )
}

export default function ProductCard({
  slug,
  name,
  volume,
  price,
  imageUrl,
  isNew,
  isBestSeller,
  discount,
  stock = 1,
  featured = false,
  fragranceFamily,
  notesTop,
  intensity,
  shortDescription,
}: ProductCardProps) {
  const finalPrice = discount ? price * (1 - discount / 100) : price
  const pixPrice = finalPrice * 0.95
  const outOfStock = stock === 0

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
  }

  /* ── Featured (horizontal) card ── */
  if (featured) {
    return (
      <Link
        href={`/produtos/${slug}`}
        className="cursor-pointer group flex flex-col md:flex-row bg-white border border-[#E8E0D4] hover:border-[#C4A55C]/40 hover:shadow-[0_12px_48px_rgba(196,165,92,0.10)] transition-all duration-500"
      >
        {/* Image */}
        <div className="relative aspect-[16/9] md:aspect-auto md:w-[42%] overflow-hidden bg-[#FAF6F0]">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              sizes="(max-width: 768px) 100vw, 42vw"
            />
          ) : (
            <CardPlaceholder large />
          )}

          <div className="absolute top-3 left-3 md:top-4 md:left-4 flex flex-col gap-1">
            {isBestSeller && (
              <span
                className="bg-[#0A0A0A] text-[#C4A55C] text-[8px] md:text-[9px] tracking-[0.15em] uppercase px-2.5 py-0.5 md:px-3 md:py-1 font-semibold"
                style={{ fontFamily: bodyFont }}
              >
                Mais Vendido
              </span>
            )}
            {discount && (
              <span
                className="bg-[#B5363A] text-white text-[8px] md:text-[9px] tracking-[0.12em] uppercase px-2.5 py-0.5 md:px-3 md:py-1 font-semibold"
                style={{ fontFamily: bodyFont }}
              >
                -{discount}%
              </span>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 p-4 md:p-10 lg:p-12 flex flex-col justify-center gap-2 md:gap-4">
          {/* Family + intensity */}
          <div className="flex items-center gap-2.5">
            {fragranceFamily && (
              <span
                className="text-[10px] md:text-[11px] tracking-[0.15em] uppercase font-bold px-2 py-0.5 md:px-2.5 md:py-1"
                style={{
                  fontFamily: bodyFont,
                  color: familyColors[fragranceFamily],
                  background: `${familyColors[fragranceFamily]}18`,
                  border: `1px solid ${familyColors[fragranceFamily]}40`,
                }}
              >
                {familyLabels[fragranceFamily]}
              </span>
            )}
            {intensity && <IntensityDots intensity={intensity} />}
          </div>

          <p
            className="text-[10px] md:text-[11px] tracking-[0.25em] uppercase text-[#6B7280]"
            style={{ fontFamily: bodyFont, fontWeight: 600 }}
          >
            {volume}
          </p>
          <h3
            className="text-2xl md:text-4xl leading-[1.15] text-[#0A0A0A]"
            style={{ fontFamily: displayFont, fontWeight: 700 }}
          >
            {name}
          </h3>

          {shortDescription && (
            <p
              className="text-xs md:text-sm text-[#4A4A4A] leading-relaxed max-w-sm line-clamp-2 md:line-clamp-none"
              style={{ fontFamily: bodyFont }}
            >
              {shortDescription}
            </p>
          )}

          {/* Notes */}
          {notesTop && notesTop.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {notesTop.slice(0, 3).map((note) => (
                <span
                  key={note}
                  className="text-[10px] md:text-[11px] px-2 py-0.5 md:px-2.5 md:py-1 bg-[#FAF6F0] text-[#4A4A4A] border border-[#E8E0D4]"
                  style={{ fontFamily: bodyFont, fontWeight: 600 }}
                >
                  {note}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-0.5 md:gap-1">
            {discount && (
              <p className="text-[11px] text-[#9CA3AF] line-through" style={{ fontFamily: bodyFont }}>
                {formatPrice(price)}
              </p>
            )}
            <p className="text-xl md:text-2xl font-semibold text-[#0A0A0A]" style={{ fontFamily: bodyFont }}>
              {formatPrice(finalPrice)}
            </p>
            <p className="text-[11px] md:text-xs text-[#2D6A4F]" style={{ fontFamily: bodyFont }}>
              Pix: {formatPrice(pixPrice)}
            </p>
          </div>

          {!outOfStock && (
            <button
              onClick={handleAddToCart}
              className="cursor-pointer mt-1 w-full md:w-auto md:px-10 py-3 md:py-3.5 bg-[#0A0A0A] text-white text-[10px] tracking-[0.25em] uppercase font-medium hover:bg-[#C4A55C] active:scale-[0.98] transition-all duration-300"
              style={{ fontFamily: bodyFont }}
            >
              Adicionar ao carrinho
            </button>
          )}
        </div>
      </Link>
    )
  }

  /* ── Regular card ── */
  return (
    <Link
      href={`/produtos/${slug}`}
      className="cursor-pointer group flex flex-col bg-white border border-[#E8E0D4] hover:border-[#C4A55C]/40 hover:shadow-[0_6px_24px_rgba(196,165,92,0.10)] transition-all duration-300"
    >
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-[#FAF6F0]">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <CardPlaceholder />
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {isNew && (
            <span
              className="bg-[#C4A55C] text-white text-[9px] tracking-[0.12em] uppercase px-2.5 py-1 font-semibold"
              style={{ fontFamily: bodyFont }}
            >
              Novo
            </span>
          )}
          {discount && (
            <span
              className="bg-[#B5363A] text-white text-[9px] tracking-[0.12em] uppercase px-2.5 py-1 font-semibold"
              style={{ fontFamily: bodyFont }}
            >
              -{discount}%
            </span>
          )}
        </div>

        {/* Favorite button */}
        <button
          className="cursor-pointer absolute top-3 right-3 w-7 h-7 flex items-center justify-center text-[#C4A55C]/0 group-hover:text-[#C4A55C]/60 hover:!text-[#C4A55C] transition-all duration-300"
          aria-label="Favoritar"
          onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
        >
          <Heart size={15} strokeWidth={1.5} />
        </button>

        {/* Out of stock */}
        {outOfStock && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span
              className="border border-[#E8E0D4] bg-white text-[#4A4A4A] text-[10px] tracking-[0.25em] uppercase px-4 py-2"
              style={{ fontFamily: bodyFont }}
            >
              Esgotado
            </span>
          </div>
        )}

        {/* Desktop hover CTA */}
        {!outOfStock && (
          <div
            className="absolute bottom-0 left-0 right-0 hidden md:flex items-center justify-center bg-[#0A0A0A]/90 py-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"
            onClick={handleAddToCart}
            role="button"
            tabIndex={-1}
            aria-hidden
          >
            <span
              className="text-[10px] tracking-[0.2em] uppercase text-white"
              style={{ fontFamily: bodyFont, fontWeight: 500 }}
            >
              Adicionar ao carrinho
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-1.5 flex-1">
        {/* Family + intensity row */}
        {(fragranceFamily || intensity) && (
          <div className="flex items-center justify-between mb-0.5">
            {fragranceFamily && (
              <span
                className="text-[10px] tracking-[0.15em] uppercase font-bold"
                style={{
                  fontFamily: bodyFont,
                  color: familyColors[fragranceFamily],
                }}
              >
                {familyLabels[fragranceFamily]}
              </span>
            )}
            {intensity && <IntensityDots intensity={intensity} />}
          </div>
        )}

        <p
          className="text-[11px] tracking-[0.2em] uppercase text-[#6B7280]"
          style={{ fontFamily: bodyFont, fontWeight: 600 }}
        >
          {volume}
        </p>
        <h3
          className="text-lg leading-[1.2] text-[#0A0A0A] line-clamp-2"
          style={{ fontFamily: displayFont, fontWeight: 700 }}
        >
          {name}
        </h3>

        {/* Notes chips */}
        {notesTop && notesTop.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {notesTop.slice(0, 2).map((note) => (
              <span
                key={note}
                className="text-[11px] px-2 py-0.5 bg-[#FAF6F0] text-[#4A4A4A] border border-[#E8E0D4]"
                style={{ fontFamily: bodyFont, fontWeight: 600 }}
              >
                {note}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-2 flex flex-col gap-0.5">
          {discount && (
            <p className="text-[11px] text-[#9CA3AF] line-through" style={{ fontFamily: bodyFont }}>
              {formatPrice(price)}
            </p>
          )}
          <p className="text-sm font-semibold text-[#0A0A0A]" style={{ fontFamily: bodyFont }}>
            {formatPrice(finalPrice)}
          </p>
          <p className="text-[11px] text-[#2D6A4F]" style={{ fontFamily: bodyFont }}>
            Pix: {formatPrice(pixPrice)}
          </p>
        </div>

        {/* Mobile CTA */}
        {!outOfStock && (
          <button
            className="cursor-pointer md:hidden mt-2 w-full py-2.5 border border-[#0A0A0A] text-[10px] tracking-[0.2em] uppercase text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white active:scale-[0.98] transition-all duration-200"
            style={{ fontFamily: bodyFont, fontWeight: 500 }}
            onClick={handleAddToCart}
          >
            Adicionar
          </button>
        )}
      </div>
    </Link>
  )
}
