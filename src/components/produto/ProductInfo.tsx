'use client'

import { MessageCircle } from 'lucide-react'
import { familyLabels, type FragranceFamily } from '@/lib/products'
import type { Perfume } from '@/lib/perfumes'
import { volumeLabel } from '@/lib/perfumes'

const bodyFont = 'var(--font-body), Montserrat, sans-serif'
const displayFont = 'var(--font-display), Cormorant Garamond, Georgia, serif'

const genderLabel: Record<string, string> = {
  feminino: 'Feminino',
  masculino: 'Masculino',
  unissex: 'Unissex',
}

function formatPrice(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function NoteRow({ label, notes }: { label: string; notes: string[] }) {
  if (notes.length === 0) return null
  return (
    <div className="flex flex-col gap-1.5">
      <p
        className="text-[9px] tracking-[0.3em] uppercase text-[#C4A55C] font-medium"
        style={{ fontFamily: bodyFont }}
      >
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {notes.map((n) => (
          <span
            key={n}
            className="text-[11px] px-2.5 py-1 bg-[#FAF6F0] text-[#4A4A4A] border border-[#E8E0D4]"
            style={{ fontFamily: bodyFont }}
          >
            {n}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function ProductInfo({ perfume }: { perfume: Perfume }) {
  const outOfStock = perfume.stock === 0
  const finalPrice = perfume.discount ? perfume.price * (1 - perfume.discount / 100) : perfume.price
  const pixPrice = finalPrice * 0.95
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(
    `Olá! Tenho interesse no perfume ${perfume.name}.`
  )}`

  return (
    <div className="flex flex-col gap-6">
      {/* Eyebrow: brand + family */}
      <div className="flex items-center gap-3 flex-wrap">
        <p
          className="text-[10px] tracking-[0.35em] uppercase text-[#9CA3AF] font-medium"
          style={{ fontFamily: bodyFont }}
        >
          {perfume.marca}
        </p>
        <span className="w-1 h-1 rounded-full bg-[#E8E0D4]" aria-hidden />
        <p
          className="text-[10px] tracking-[0.3em] uppercase text-[#C4A55C] font-semibold"
          style={{ fontFamily: bodyFont }}
        >
          {familyLabels[perfume.fragranceFamily as FragranceFamily]}
        </p>
      </div>

      {/* Title */}
      <h1
        className="text-3xl md:text-5xl leading-tight text-[#0A0A0A]"
        style={{ fontFamily: displayFont, fontWeight: 500 }}
      >
        {perfume.nome}
        {perfume.versao ? <span className="text-[#C4A55C] italic"> {perfume.versao}</span> : null}
      </h1>

      {/* Meta chips: concentracao, genero, volume, tipo */}
      <div className="flex flex-wrap gap-2">
        {perfume.concentracao && (
          <span
            className="text-[10px] tracking-[0.1em] uppercase px-3 py-1.5 border border-[#E8E0D4] text-[#4A4A4A]"
            style={{ fontFamily: bodyFont }}
          >
            {perfume.concentracao}
          </span>
        )}
        <span
          className="text-[10px] tracking-[0.1em] uppercase px-3 py-1.5 border border-[#E8E0D4] text-[#4A4A4A]"
          style={{ fontFamily: bodyFont }}
        >
          {genderLabel[perfume.genero] ?? perfume.genero}
        </span>
        {volumeLabel(perfume) && (
          <span
            className="text-[10px] tracking-[0.1em] uppercase px-3 py-1.5 border border-[#E8E0D4] text-[#4A4A4A]"
            style={{ fontFamily: bodyFont }}
          >
            {volumeLabel(perfume)}
          </span>
        )}
        {perfume.tipoProduto !== 'Perfume' && (
          <span
            className="text-[10px] tracking-[0.1em] uppercase px-3 py-1.5 border border-[#E8E0D4] text-[#4A4A4A]"
            style={{ fontFamily: bodyFont }}
          >
            {perfume.tipoProduto}
          </span>
        )}
      </div>

      {/* Short description */}
      {perfume.shortDescription && (
        <p className="text-sm leading-relaxed text-[#6B7280] max-w-lg" style={{ fontFamily: bodyFont }}>
          {perfume.shortDescription}
        </p>
      )}

      {/* Price block */}
      <div className="flex flex-col gap-1 pt-2 border-t border-[#E8E0D4]">
        {perfume.discount && (
          <p className="text-sm text-[#9CA3AF] line-through" style={{ fontFamily: bodyFont }}>
            {formatPrice(perfume.price)}
          </p>
        )}
        <p className="text-3xl font-semibold text-[#0A0A0A]" style={{ fontFamily: bodyFont }}>
          {formatPrice(finalPrice)}
        </p>
        <p className="text-sm text-[#2D6A4F]" style={{ fontFamily: bodyFont }}>
          Pix: {formatPrice(pixPrice)}
        </p>
      </div>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row gap-3">
        {!outOfStock ? (
          <button
            className="cursor-pointer flex-1 px-8 py-4 bg-[#0A0A0A] text-white text-[11px] tracking-[0.25em] uppercase font-medium hover:bg-[#C4A55C] active:scale-[0.98] transition-all duration-300"
            style={{ fontFamily: bodyFont }}
          >
            Adicionar ao carrinho
          </button>
        ) : (
          <span
            className="flex-1 text-center px-8 py-4 border border-[#E8E0D4] text-[#9CA3AF] text-[11px] tracking-[0.25em] uppercase"
            style={{ fontFamily: bodyFont }}
          >
            Esgotado
          </span>
        )}
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="cursor-pointer inline-flex items-center justify-center gap-2 px-6 py-4 border border-[#0A0A0A] text-[#0A0A0A] text-[11px] tracking-[0.2em] uppercase font-medium hover:bg-[#0A0A0A] hover:text-white active:scale-[0.98] transition-all duration-300"
          style={{ fontFamily: bodyFont }}
        >
          <MessageCircle size={15} strokeWidth={1.5} />
          WhatsApp
        </a>
      </div>

      {/* Long description */}
      {perfume.description && (
        <div className="pt-6 border-t border-[#E8E0D4] flex flex-col gap-3">
          <p
            className="text-[10px] tracking-[0.3em] uppercase text-[#C4A55C] font-medium"
            style={{ fontFamily: bodyFont }}
          >
            Sobre a fragrância
          </p>
          <p className="text-sm leading-relaxed text-[#4A4A4A]" style={{ fontFamily: bodyFont }}>
            {perfume.description}
          </p>
        </div>
      )}

      {/* Notes pyramid */}
      {(perfume.notesTop.length > 0 || perfume.notesHeart.length > 0 || perfume.notesBase.length > 0) && (
        <div className="pt-6 border-t border-[#E8E0D4] flex flex-col gap-4">
          <NoteRow label="Notas de saída" notes={perfume.notesTop} />
          <NoteRow label="Notas de coração" notes={perfume.notesHeart} />
          <NoteRow label="Notas de fundo" notes={perfume.notesBase} />
        </div>
      )}

      {/* Occasions */}
      {perfume.occasion.length > 0 && (
        <div className="pt-6 border-t border-[#E8E0D4] flex flex-col gap-2">
          <p
            className="text-[9px] tracking-[0.3em] uppercase text-[#C4A55C] font-medium"
            style={{ fontFamily: bodyFont }}
          >
            Combina com
          </p>
          <div className="flex flex-wrap gap-1.5">
            {perfume.occasion.map((o) => (
              <span
                key={o}
                className="text-[11px] px-2.5 py-1 bg-[#FAF6F0] text-[#4A4A4A] border border-[#E8E0D4] capitalize"
                style={{ fontFamily: bodyFont }}
              >
                {o}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
