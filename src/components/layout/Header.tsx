'use client'

import { useState, useEffect, useRef, Fragment } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag, Menu, X, Search, ChevronDown } from 'lucide-react'
import SearchOverlay from './SearchOverlay'

const bodyFont = 'var(--font-body), Montserrat, sans-serif'

interface NavColumn { heading: string; links: { label: string; href: string }[] }
interface NavItemLink  { key: string; label: string; href: string; columns?: never }
interface NavItemMenu  { key: string; label: string; columns: NavColumn[]; href?: never }
type NavItem = NavItemLink | NavItemMenu

const megaNav: NavItem[] = [
  {
    key: 'perfumes',
    label: 'Perfumes',
    columns: [
      {
        heading: 'Por perfil',
        links: [
          { label: 'Todos os perfumes', href: '/produtos' },
          { label: 'Femininos', href: '/produtos?perfil=feminino' },
          { label: 'Masculinos', href: '/produtos?perfil=masculino' },
          { label: 'Unissex', href: '/produtos?perfil=unissex' },
        ],
      },
      {
        heading: 'Destaques',
        links: [
          { label: 'Mais vendidos', href: '/produtos?sort=mais-vendidos' },
          { label: 'Lançamentos', href: '/produtos?filter=novo' },
          { label: 'Promoções', href: '/produtos?filter=promocao' },
        ],
      },
      {
        heading: 'Volume',
        links: [
          { label: '50ml', href: '/produtos?volume=50ml' },
          { label: '75ml', href: '/produtos?volume=75ml' },
          { label: '100ml', href: '/produtos?volume=100ml' },
        ],
      },
    ],
  },
  {
    key: 'familias',
    label: 'Famílias Olfativas',
    columns: [
      {
        heading: 'Famílias',
        links: [
          { label: 'Floral', href: '/produtos?familia=floral' },
          { label: 'Amadeirado', href: '/produtos?familia=amadeirado' },
          { label: 'Cítrico', href: '/produtos?familia=citrico' },
          { label: 'Oriental', href: '/produtos?familia=oriental' },
        ],
      },
      {
        heading: '',
        links: [
          { label: 'Frutal', href: '/produtos?familia=frutal' },
          { label: 'Aromático', href: '/produtos?familia=aromatico' },
          { label: 'Gourmand', href: '/produtos?familia=gourmand' },
          { label: 'Musk', href: '/produtos?familia=musk' },
        ],
      },
    ],
  },
  {
    key: 'momentos',
    label: 'Momentos',
    columns: [
      {
        heading: 'Por ocasião',
        links: [
          { label: 'Dia a dia', href: '/produtos?momento=dia' },
          { label: 'Noite', href: '/produtos?momento=noite' },
          { label: 'Trabalho', href: '/produtos?momento=trabalho' },
          { label: 'Encontros', href: '/produtos?momento=encontros' },
          { label: 'Ocasiões especiais', href: '/produtos?momento=especial' },
          { label: 'Para presentear', href: '/produtos?momento=presente' },
        ],
      },
    ],
  },
  {
    key: 'presentes',
    label: 'Presentes',
    columns: [
      {
        heading: 'Presentear',
        links: [
          { label: 'Kits especiais', href: '/produtos?tipo=kit' },
          { label: 'Até R$ 150', href: '/produtos?preco=ate150' },
          { label: 'Até R$ 250', href: '/produtos?preco=ate250' },
          { label: 'Embalagem especial', href: '/produtos?embalagem=especial' },
          { label: 'Mais presenteáveis', href: '/produtos?filter=giftable' },
        ],
      },
    ],
  },
  { key: 'novidades', label: 'Novidades', href: '/produtos?filter=novo' },
  { key: 'sobre', label: 'Sobre', href: '/sobre' },
]

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    const handler = () => setSearchOpen(true)
    document.addEventListener('open-search', handler)
    return () => document.removeEventListener('open-search', handler)
  }, [])

  function openMenu(key: string) {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setActiveMenu(key)
  }

  function scheduleClose() {
    closeTimer.current = setTimeout(() => setActiveMenu(null), 120)
  }

  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }

  return (
    <>
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#0A0A0A]/[0.97] backdrop-blur-md shadow-[0_1px_0_rgba(196,165,92,0.15),0_4px_24px_rgba(0,0,0,0.3)]'
            : 'bg-[#0A0A0A] border-b border-white/[0.08]'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-[68px]">

            {/* Mobile toggle */}
            <button
              className="cursor-pointer md:hidden text-white p-2 -ml-2 hover:text-[#C4A55C] transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen
                ? <X size={20} strokeWidth={1.5} />
                : <Menu size={20} strokeWidth={1.5} />
              }
            </button>

            {/* Logo */}
            <Link href="/" className="cursor-pointer flex items-center">
              <Image
                src="/logos/MADRI_HORIZONTAL.svg"
                alt="MADRI Perfumes"
                width={130}
                height={40}
                className="h-7 md:h-8 w-auto"
                priority
              />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center" aria-label="Principal">
              {megaNav.map((item, index) => {
                const hasDropdown = 'columns' in item
                const isEditorial = !hasDropdown
                const prevHadDropdown = index > 0 && 'columns' in megaNav[index - 1]
                const isNovidades = item.key === 'novidades'
                const isSobre = item.key === 'sobre'

                return (
                  <Fragment key={item.key}>
                    {/* Separator between shopping group and editorial group */}
                    {isEditorial && prevHadDropdown && (
                      <div className="w-px h-4 bg-white/12 mx-1" aria-hidden />
                    )}

                    <div
                      className="relative group"
                      onMouseEnter={() => hasDropdown ? openMenu(item.key) : undefined}
                      onMouseLeave={hasDropdown ? scheduleClose : undefined}
                    >
                      {!hasDropdown ? (
                        <Link
                          href={(item as NavItemLink).href}
                          className={`cursor-pointer flex items-center px-3 py-2 text-[11px] tracking-[0.18em] uppercase transition-colors duration-200 ${
                            isNovidades
                              ? 'text-[#C4A55C]/85 hover:text-[#C4A55C]'
                              : isSobre
                              ? 'text-white/50 hover:text-white/80'
                              : 'text-white hover:text-[#C4A55C]'
                          }`}
                          style={{ fontFamily: bodyFont, fontWeight: 500 }}
                        >
                          {isNovidades && (
                            <span className="mr-1.5 w-1 h-1 rounded-full bg-[#C4A55C] flex-shrink-0" aria-hidden />
                          )}
                          <span className="relative">
                            {item.label}
                            <span
                              className="absolute -bottom-0.5 left-0 right-0 h-px bg-[#C4A55C] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
                              aria-hidden
                            />
                          </span>
                        </Link>
                      ) : (
                        <button
                          className={`cursor-pointer flex items-center gap-1 px-3 py-2 text-[11px] tracking-[0.18em] uppercase transition-colors duration-200 ${
                            activeMenu === item.key ? 'text-[#C4A55C]' : 'text-white hover:text-[#C4A55C]'
                          }`}
                          style={{ fontFamily: bodyFont, fontWeight: 500 }}
                          aria-expanded={activeMenu === item.key}
                        >
                          <span className="relative">
                            {item.label}
                            <span
                              className={`absolute -bottom-0.5 left-0 right-0 h-px bg-[#C4A55C] origin-left transition-transform duration-300 ${
                                activeMenu === item.key ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                              }`}
                              aria-hidden
                            />
                          </span>
                          <ChevronDown
                            size={11}
                            strokeWidth={2}
                            className={`transition-transform duration-200 flex-shrink-0 ${activeMenu === item.key ? 'rotate-180' : ''}`}
                          />
                        </button>
                      )}

                      {/* Dropdown */}
                      {item.columns && activeMenu === item.key && (
                        <div
                          className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50"
                          onMouseEnter={cancelClose}
                          onMouseLeave={scheduleClose}
                        >
                          <div
                            className="bg-[#0A0A0A] border border-white/[0.10] shadow-[0_16px_48px_rgba(0,0,0,0.5)] py-7 px-8"
                            style={{
                              minWidth: item.columns.length === 3 ? '520px' : item.columns.length === 2 ? '360px' : '220px',
                            }}
                          >
                            <div className={`grid gap-10 ${item.columns.length === 1 ? 'grid-cols-1' : item.columns.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                              {item.columns.map((col, ci) => (
                                <div key={ci}>
                                  {col.heading && (
                                    <p
                                      className="text-[9px] tracking-[0.3em] uppercase text-[#C4A55C]/70 mb-3 font-semibold"
                                      style={{ fontFamily: bodyFont }}
                                    >
                                      {col.heading}
                                    </p>
                                  )}
                                  <ul className="flex flex-col gap-2">
                                    {col.links.map((link) => (
                                      <li key={link.href}>
                                        <Link
                                          href={link.href}
                                          onClick={() => setActiveMenu(null)}
                                          className="text-[12px] text-white/65 hover:text-white transition-colors whitespace-nowrap"
                                          style={{ fontFamily: bodyFont }}
                                        >
                                          {link.label}
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </div>
                          {/* Arrow */}
                          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 bg-[#0A0A0A] border-l border-t border-white/[0.10] -mt-1.5" />
                        </div>
                      )}
                    </div>
                  </Fragment>
                )
              })}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-1">
              {/* Search */}
              <button
                onClick={() => setSearchOpen(true)}
                className="cursor-pointer p-2 text-white hover:text-[#C4A55C] transition-colors duration-200"
                aria-label="Buscar fragrâncias"
              >
                <Search size={18} strokeWidth={1.5} />
              </button>

              {/* Cart */}
              <Link
                href="/carrinho"
                className="cursor-pointer relative p-2 -mr-2 text-white hover:text-[#C4A55C] transition-colors duration-200"
                aria-label="Carrinho de compras"
              >
                <ShoppingBag size={18} strokeWidth={1.5} />
                <span
                  className="absolute top-0.5 right-0.5 bg-[#C4A55C] text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold leading-none"
                  style={{ fontFamily: bodyFont }}
                >
                  0
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile drawer */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            mobileOpen ? 'max-h-[80vh]' : 'max-h-0'
          }`}
        >
          <div className="bg-[#0A0A0A] border-t border-white/[0.08] px-4 py-5 overflow-y-auto max-h-[80vh]">

            {/* Mobile search */}
            <button
              onClick={() => { setMobileOpen(false); setSearchOpen(true) }}
              className="cursor-pointer w-full flex items-center gap-3 border border-white/10 px-4 py-3 mb-4 text-white/40 hover:text-white/70 transition-colors"
            >
              <Search size={15} strokeWidth={1.5} />
              <span className="text-[11px]" style={{ fontFamily: bodyFont }}>Buscar fragrâncias...</span>
            </button>

            <nav className="flex flex-col">
              {megaNav.map((item) => {
                const isExpanded = mobileExpanded === item.key

                return (
                  <div key={item.key} className="border-b border-white/[0.06] last:border-0">
                    {!item.columns ? (
                      <Link
                        href={(item as NavItemLink).href}
                        className="flex items-center justify-between py-4 text-[12px] tracking-[0.2em] uppercase text-white/70 hover:text-white transition-colors"
                        style={{ fontFamily: bodyFont, fontWeight: 500 }}
                        onClick={() => setMobileOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <>
                        <button
                          className="cursor-pointer flex items-center justify-between w-full py-4 text-[12px] tracking-[0.2em] uppercase text-white/70 hover:text-white transition-colors"
                          style={{ fontFamily: bodyFont, fontWeight: 500 }}
                          onClick={() => setMobileExpanded(isExpanded ? null : item.key)}
                          aria-expanded={isExpanded}
                        >
                          {item.label}
                          <ChevronDown
                            size={14}
                            strokeWidth={1.5}
                            className={`transition-transform duration-200 ${isExpanded ? 'rotate-180 text-[#C4A55C]' : ''}`}
                          />
                        </button>

                        <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-96' : 'max-h-0'}`}>
                          <div className="pb-4 pl-2">
                            {item.columns.flatMap((col) => col.links).map((link) => (
                              <Link
                                key={link.href}
                                href={link.href}
                                className="block py-2 text-[11px] text-white/45 hover:text-[#C4A55C] transition-colors"
                                style={{ fontFamily: bodyFont }}
                                onClick={() => { setMobileOpen(false); setMobileExpanded(null) }}
                              >
                                {link.label}
                              </Link>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </nav>
          </div>
        </div>
      </header>
    </>
  )
}
