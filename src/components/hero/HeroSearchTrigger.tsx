'use client'

import { Search } from 'lucide-react'

const bodyFont = 'var(--font-body), Montserrat, sans-serif'

export default function HeroSearchTrigger() {
  function handleClick() {
    document.dispatchEvent(new CustomEvent('open-search'))
  }

  return (
    <button
      onClick={handleClick}
      className="cursor-pointer flex items-center gap-3 border border-[#E8E0D4] bg-white px-4 py-3 max-w-sm w-full hover:border-[#C4A55C]/50 transition-colors text-left animate-fade-up-delay-1"
      aria-label="Buscar fragrâncias"
    >
      <Search size={15} strokeWidth={1.5} className="text-[#C4A55C] flex-shrink-0" />
      <span
        className="text-[12px] text-[#9CA3AF]"
        style={{ fontFamily: bodyFont }}
      >
        Busque por nome, família ou ocasião
      </span>
    </button>
  )
}
