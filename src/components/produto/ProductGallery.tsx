'use client'

import { useState } from 'react'
import Image from 'next/image'

export default function ProductGallery({ name, images }: { name: string; images: string[] }) {
  const [active, setActive] = useState(0)

  if (images.length === 0) {
    return (
      <div className="relative aspect-[3/4] w-full bg-[#FAF6F0] border border-[#E8E0D4] flex items-center justify-center overflow-hidden">
        <Image
          src="/logos/MADRI.svg"
          alt=""
          width={72}
          height={72}
          className="w-16 h-16 md:w-[72px] md:h-[72px] opacity-[0.12]"
        />
        <span className="sr-only">Foto de {name} em breve</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[3/4] w-full bg-[#FAF6F0] border border-[#E8E0D4] overflow-hidden">
        <Image
          src={images[active]}
          alt={name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>

      {images.length > 1 && (
        <div className="flex gap-2">
          {images.map((src, i) => (
            <button
              key={src}
              onClick={() => setActive(i)}
              className={`cursor-pointer relative w-16 h-16 md:w-20 md:h-20 flex-shrink-0 bg-[#FAF6F0] border overflow-hidden transition-colors ${
                i === active ? 'border-[#C4A55C]' : 'border-[#E8E0D4] hover:border-[#C4A55C]/50'
              }`}
              aria-label={`Ver foto ${i + 1} de ${name}`}
            >
              <Image src={src} alt="" fill className="object-cover" sizes="80px" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
