'use client'

import { useState } from 'react'
import Link from 'next/link'
import { familyLabels, type FragranceFamily, type Intensity } from '@/lib/products'
import { perfumes, volumeLabel } from '@/lib/perfumes'
import ProductCard from '@/components/produto/ProductCard'

const bodyFont = 'var(--font-body), Montserrat, sans-serif'
const displayFont = 'var(--font-display), Cormorant Garamond, Georgia, serif'

type Recipient = 'mim' | 'presentear' | null
type Moment = 'dia' | 'noite' | 'trabalho' | 'encontros' | 'especial' | null

const momentLabels: Record<string, string> = {
  dia: 'Dia a dia',
  noite: 'Noite',
  trabalho: 'Trabalho',
  encontros: 'Encontros',
  especial: 'Ocasiões especiais',
}

const intensityOptions: { key: Intensity; label: string; desc: string }[] = [
  { key: 'leve', label: 'Leve', desc: 'Suave e discreto' },
  { key: 'moderada', label: 'Moderada', desc: 'Equilibrado' },
  { key: 'marcante', label: 'Marcante', desc: 'Intenso e duradouro' },
]

const familyOptions = (Object.keys(familyLabels) as FragranceFamily[]).slice(0, 6)

function Chip({
  label,
  active,
  onClick,
  desc,
}: {
  label: string
  active: boolean
  onClick: () => void
  desc?: string
}) {
  return (
    <button
      onClick={onClick}
      className={`cursor-pointer flex flex-col items-center gap-0.5 px-4 py-3 border text-left transition-all duration-200 ${
        active
          ? 'bg-[#0A0A0A] border-[#0A0A0A] text-white'
          : 'bg-white border-[#E8E0D4] text-[#4A4A4A] hover:border-[#C4A55C]/60 hover:text-[#0A0A0A]'
      }`}
    >
      <span className="text-[11px] font-semibold tracking-[0.1em]" style={{ fontFamily: bodyFont }}>
        {label}
      </span>
      {desc && (
        <span
          className={`text-[9px] ${active ? 'text-white/60' : 'text-[#9CA3AF]'}`}
          style={{ fontFamily: bodyFont }}
        >
          {desc}
        </span>
      )}
    </button>
  )
}

export default function FragranceFinderSection() {
  const [recipient, setRecipient] = useState<Recipient>(null)
  const [moment, setMoment] = useState<Moment>(null)
  const [intensity, setIntensity] = useState<Intensity | null>(null)
  const [family, setFamily] = useState<FragranceFamily | null>(null)

  const step = !recipient ? 1 : !moment ? 2 : !intensity ? 3 : !family ? 4 : 5

  const recommendations = perfumes
    .filter((p) => {
      if (moment && !p.occasion.includes(moment as never)) return false
      if (intensity && p.intensity !== intensity) return false
      if (family && p.fragranceFamily !== family) return false
      return p.stock > 0
    })
    .slice(0, 3)

  function reset() {
    setRecipient(null)
    setMoment(null)
    setIntensity(null)
    setFamily(null)
  }

  return (
    <section className="bg-white py-20 md:py-28 border-y border-[#E8E0D4]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-10 md:mb-14">
          <p
            className="text-[10px] tracking-[0.4em] uppercase text-[#C4A55C] font-medium mb-3"
            style={{ fontFamily: bodyFont }}
          >
            Guia de descoberta
          </p>
          <h2
            className="text-4xl md:text-5xl text-[#0A0A0A] mb-3"
            style={{ fontFamily: displayFont, fontWeight: 500 }}
          >
            Encontre sua fragrância ideal
          </h2>
          <p className="text-sm text-[#6B7280]" style={{ fontFamily: bodyFont }}>
            Responda pelo seu momento, intensidade e estilo preferido.
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-1 mb-10 justify-center">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-1">
              <div
                className={`w-6 h-0.5 transition-all duration-300 ${s < step ? 'bg-[#C4A55C]' : s === step ? 'bg-[#0A0A0A]' : 'bg-[#E8E0D4]'}`}
              />
            </div>
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="text-center">
            <p
              className="text-xl md:text-2xl text-[#0A0A0A] mb-8"
              style={{ fontFamily: displayFont, fontWeight: 500 }}
            >
              Para quem é a fragrância?
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Chip label="Para mim" active={recipient === 'mim'} onClick={() => setRecipient('mim')} />
              <Chip label="Para presentear" active={recipient === 'presentear'} onClick={() => setRecipient('presentear')} />
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="text-center">
            <p
              className="text-xl md:text-2xl text-[#0A0A0A] mb-8"
              style={{ fontFamily: displayFont, fontWeight: 500 }}
            >
              Qual o momento principal?
            </p>
            <div className="flex gap-2 justify-center flex-wrap">
              {Object.entries(momentLabels).map(([key, label]) => (
                <Chip
                  key={key}
                  label={label}
                  active={moment === key}
                  onClick={() => setMoment(key as Moment)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="text-center">
            <p
              className="text-xl md:text-2xl text-[#0A0A0A] mb-8"
              style={{ fontFamily: displayFont, fontWeight: 500 }}
            >
              Qual intensidade você prefere?
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              {intensityOptions.map(({ key, label, desc }) => (
                <Chip key={key} label={label} desc={desc} active={intensity === key} onClick={() => setIntensity(key)} />
              ))}
            </div>
          </div>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <div className="text-center">
            <p
              className="text-xl md:text-2xl text-[#0A0A0A] mb-8"
              style={{ fontFamily: displayFont, fontWeight: 500 }}
            >
              Qual caminho olfativo?
            </p>
            <div className="flex gap-2 justify-center flex-wrap">
              {familyOptions.map((f) => (
                <Chip
                  key={f}
                  label={familyLabels[f]}
                  active={family === f}
                  onClick={() => setFamily(f)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step 5 — Results */}
        {step === 5 && (
          <div>
            <div className="text-center mb-8">
              <p
                className="text-xl md:text-2xl text-[#0A0A0A] mb-2"
                style={{ fontFamily: displayFont, fontWeight: 500 }}
              >
                {recommendations.length > 0
                  ? `${recommendations.length} fragrância${recommendations.length !== 1 ? 's' : ''} para você`
                  : 'Explorando nossa coleção...'}
              </p>
              <p className="text-[12px] text-[#9CA3AF]" style={{ fontFamily: bodyFont }}>
                {recipient === 'mim' ? 'Para você · ' : 'Para presentear · '}
                {moment && momentLabels[moment]} · {intensity && intensity} · {family && familyLabels[family]}
              </p>
            </div>

            {recommendations.length > 0 ? (
              <div className={`grid gap-4 mb-8 ${recommendations.length === 1 ? 'grid-cols-1 max-w-xs mx-auto' : recommendations.length === 2 ? 'grid-cols-2 max-w-md mx-auto' : 'grid-cols-1 sm:grid-cols-3'}`}>
                {recommendations.map((p) => (
                  <ProductCard
                    key={p.id}
                    id={p.id}
                    slug={p.slug}
                    name={p.name}
                    volume={volumeLabel(p)}
                    price={p.price}
                    discount={p.discount ?? undefined}
                    stock={p.stock}
                    isNew={p.isNew}
                    fragranceFamily={p.fragranceFamily}
                    notesTop={p.notesTop}
                    intensity={p.intensity}
                    shortDescription={p.shortDescription ?? undefined}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 mb-8">
                <p className="text-[#9CA3AF] text-sm mb-2" style={{ fontFamily: bodyFont }}>
                  Nenhuma fragrância encontrada com esses critérios.
                </p>
                <p className="text-[#B8B0A8] text-[12px]" style={{ fontFamily: bodyFont }}>
                  Tente ajustar suas preferências para ver mais opções.
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/produtos"
                className="cursor-pointer inline-flex items-center justify-center px-8 py-3.5 bg-[#0A0A0A] text-white text-[10px] tracking-[0.25em] uppercase font-medium hover:bg-[#C4A55C] active:scale-[0.98] transition-all duration-300"
                style={{ fontFamily: bodyFont }}
              >
                Ver todas as fragrâncias
              </Link>
              <button
                onClick={reset}
                className="cursor-pointer inline-flex items-center justify-center px-8 py-3.5 border border-[#E8E0D4] text-[#4A4A4A] text-[10px] tracking-[0.25em] uppercase font-medium hover:border-[#0A0A0A] hover:text-[#0A0A0A] active:scale-[0.98] transition-all duration-200"
                style={{ fontFamily: bodyFont }}
              >
                Recomeçar
              </button>
            </div>
          </div>
        )}

        {/* Back navigation (steps 2-4) */}
        {step >= 2 && step < 5 && (
          <div className="text-center mt-6">
            <button
              onClick={reset}
              className="cursor-pointer text-[11px] text-[#9CA3AF] hover:text-[#4A4A4A] transition-colors"
              style={{ fontFamily: bodyFont }}
            >
              ← Recomeçar
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
