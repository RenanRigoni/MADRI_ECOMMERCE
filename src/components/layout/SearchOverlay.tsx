'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { X, Search } from 'lucide-react'
import { products, familyLabels, type Product } from '@/lib/products'

const bodyFont = 'var(--font-body), Montserrat, sans-serif'
const displayFont = 'var(--font-display), Cormorant Garamond, Georgia, serif'

function formatPrice(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const familyChips = Object.entries(familyLabels).map(([k, v]) => ({ key: k, label: v }))

interface Props {
  open: boolean
  onClose: () => void
}

export default function SearchOverlay({ open, onClose }: Props) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      setQuery('')
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const results: Product[] = query.trim().length < 2
    ? []
    : products.filter((p) => {
        const q = query.toLowerCase()
        return (
          p.name.toLowerCase().includes(q) ||
          familyLabels[p.fragranceFamily].toLowerCase().includes(q) ||
          p.notesTop.some((n) => n.toLowerCase().includes(q)) ||
          p.notesHeart.some((n) => n.toLowerCase().includes(q)) ||
          p.notesBase.some((n) => n.toLowerCase().includes(q)) ||
          p.shortDescription.toLowerCase().includes(q)
        )
      })

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col"
      style={{ background: 'rgba(10,10,10,0.94)', backdropFilter: 'blur(8px)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Busca de fragrâncias"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-5 border-b border-white/[0.08]">
        <p
          className="text-[10px] tracking-[0.35em] uppercase text-[#C4A55C]"
          style={{ fontFamily: bodyFont, fontWeight: 500 }}
        >
          Buscar fragrâncias
        </p>
        <button
          onClick={onClose}
          className="cursor-pointer text-white/50 hover:text-white transition-colors p-1"
          aria-label="Fechar busca"
        >
          <X size={20} strokeWidth={1.5} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">

          {/* Input */}
          <div className="flex items-center gap-3 border-b border-white/20 pb-4 mb-8">
            <Search size={18} strokeWidth={1.5} className="text-white/40 flex-shrink-0" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Busque por perfume, nota ou ocasião"
              className="flex-1 bg-transparent text-white text-xl placeholder:text-white/25 outline-none"
              style={{ fontFamily: displayFont, fontWeight: 400 }}
              autoComplete="off"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="cursor-pointer text-white/30 hover:text-white/60 transition-colors"
                aria-label="Limpar busca"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            )}
          </div>

          {/* No query: show family chips */}
          {!query.trim() && (
            <div>
              <p
                className="text-[10px] tracking-[0.3em] uppercase text-white/30 mb-4"
                style={{ fontFamily: bodyFont, fontWeight: 500 }}
              >
                Buscar por família olfativa
              </p>
              <div className="flex flex-wrap gap-2">
                {familyChips.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setQuery(label)}
                    className="cursor-pointer text-[11px] tracking-[0.15em] uppercase px-4 py-2 border border-white/15 text-white/60 hover:border-[#C4A55C]/50 hover:text-[#C4A55C] transition-colors"
                    style={{ fontFamily: bodyFont, fontWeight: 500 }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {query.trim().length >= 2 && (
            <div>
              {results.length === 0 ? (
                <div className="text-center py-12">
                  <p
                    className="text-white/50 text-lg mb-2"
                    style={{ fontFamily: displayFont, fontWeight: 400 }}
                  >
                    Nenhuma fragrância encontrada.
                  </p>
                  <p
                    className="text-white/30 text-[12px]"
                    style={{ fontFamily: bodyFont }}
                  >
                    Experimente buscar por família olfativa, ocasião ou intensidade.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-0">
                  <p
                    className="text-[10px] tracking-[0.3em] uppercase text-white/30 mb-4"
                    style={{ fontFamily: bodyFont, fontWeight: 500 }}
                  >
                    {results.length} resultado{results.length !== 1 ? 's' : ''}
                  </p>
                  {results.map((p) => {
                    const finalPrice = p.discount ? p.price * (1 - p.discount / 100) : p.price
                    return (
                      <Link
                        key={p.id}
                        href={`/produtos/${p.slug}`}
                        onClick={onClose}
                        className="flex items-center gap-5 py-4 border-b border-white/[0.07] hover:bg-white/[0.03] transition-colors px-2 -mx-2"
                      >
                        {/* Placeholder image */}
                        <div className="w-14 h-14 bg-white/[0.06] flex-shrink-0 flex items-center justify-center">
                          <span className="text-[#C4A55C]/30 text-xl" style={{ fontFamily: displayFont }}>M</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-white text-base leading-tight truncate"
                            style={{ fontFamily: displayFont, fontWeight: 500 }}
                          >
                            {p.name}
                          </p>
                          <p
                            className="text-white/35 text-[11px] mt-0.5"
                            style={{ fontFamily: bodyFont }}
                          >
                            {p.volume} · {familyLabels[p.fragranceFamily]}
                          </p>
                        </div>
                        <p
                          className="text-white/80 text-sm font-semibold flex-shrink-0"
                          style={{ fontFamily: bodyFont }}
                        >
                          {formatPrice(finalPrice)}
                        </p>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
