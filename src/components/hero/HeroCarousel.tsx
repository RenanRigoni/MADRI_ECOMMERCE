'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface Props {
  images: string[]
}

export default function HeroCarousel({ images }: Props) {
  const [current, setCurrent] = useState(0)
  const n = images.length

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % n)
    }, 3500)
    return () => clearInterval(interval)
  }, [n])

  /* ── Calcula posição circular de cada imagem relativa ao current ── */
  function getSlot(i: number) {
    const dist = ((i - current + n) % n)

    if (dist === 0) {
      // Center — destaque total
      return {
        transform: 'translateX(0) scale(1)',
        opacity: 1,
        zIndex: 10,
        filter: 'none',
      }
    }
    if (dist === 1) {
      // Next — à direita, parcialmente visível atrás do central
      return {
        transform: 'translateX(38%) scale(0.72)',
        opacity: 0.42,
        zIndex: 5,
        filter: 'none',
      }
    }
    if (dist === n - 1) {
      // Prev — à esquerda, parcialmente visível atrás do central
      return {
        transform: 'translateX(-38%) scale(0.72)',
        opacity: 0.42,
        zIndex: 5,
        filter: 'none',
      }
    }
    if (dist === 2) {
      // Far-right buffer (fora de cena, pronto para entrar)
      return {
        transform: 'translateX(90%) scale(0.55)',
        opacity: 0,
        zIndex: 0,
        filter: 'none',
      }
    }
    // Far-left buffer (saindo de cena)
    return {
      transform: 'translateX(-90%) scale(0.55)',
      opacity: 0,
      zIndex: 0,
      filter: 'none',
    }
  }

  return (
    <div className="relative w-full overflow-hidden" style={{ height: '440px' }}>

      {/* Glow radial atrás do perfume central */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 50% 60% at 50% 55%, rgba(196,165,92,0.09) 0%, transparent 70%)',
        }}
      />

      {images.map((src, i) => {
        const slot = getSlot(i)
        return (
          <div
            key={src}
            className="absolute inset-0 flex items-center justify-center"
            style={{
              ...slot,
              transition: 'transform 0.65s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.65s ease',
              willChange: 'transform, opacity',
            }}
          >
            <Image
              src={src}
              alt={`Fragrância MADRI ${i + 1}`}
              width={260}
              height={380}
              className="object-contain select-none"
              style={{
                maxHeight: '360px',
                width: 'auto',
                filter: slot.zIndex === 10
                  ? 'drop-shadow(0 20px 40px rgba(0,0,0,0.18))'
                  : 'drop-shadow(0 8px 16px rgba(0,0,0,0.10))',
              }}
              priority={i === 0}
              draggable={false}
            />
          </div>
        )
      })}

      {/* Indicadores */}
      <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1.5 z-20">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="cursor-pointer p-1"
            aria-label={`Fragrância ${i + 1}`}
          >
            <div
              className="rounded-full transition-all duration-400"
              style={{
                width: i === current ? '18px' : '5px',
                height: '4px',
                background: i === current ? '#C4A55C' : 'rgba(196,165,92,0.35)',
              }}
            />
          </button>
        ))}
      </div>
    </div>
  )
}
