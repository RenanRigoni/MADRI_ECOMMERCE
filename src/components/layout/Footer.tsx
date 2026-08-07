import Link from 'next/link'
import Image from 'next/image'
import NewsletterForm from './NewsletterForm'

const bodyFont = 'var(--font-body), Montserrat, sans-serif'
const displayFont = 'var(--font-display), Cormorant Garamond, Georgia, serif'

export default function Footer() {
  return (
    <footer className="bg-[#0A0A0A] text-white">

      {/* Newsletter */}
      <div className="border-b border-white/[0.07]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="text-center sm:text-left">
              <p
                className="text-xl text-white leading-snug"
                style={{ fontFamily: displayFont, fontWeight: 500 }}
              >
                Receba novidades exclusivas
              </p>
              <p
                className="text-[11px] text-gray-400 mt-0.5 tracking-wide"
                style={{ fontFamily: bodyFont }}
              >
                Lançamentos e fragrâncias direto no seu e-mail
              </p>
            </div>
            <NewsletterForm />
          </div>
        </div>
      </div>

      {/* Main columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 md:gap-8">

          {/* Brand */}
          <div className="flex flex-col gap-5">
            <Image
              src="/logos/MADRI_HORIZONTAL.svg"
              alt="MADRI Perfumes"
              width={120}
              height={35}
              className="h-7 w-auto brightness-0 invert opacity-70"
            />
            <p
              className="text-[12px] text-gray-400 leading-relaxed max-w-xs"
              style={{ fontFamily: bodyFont }}
            >
              Fragrâncias exclusivas para quem vive com intenção. Envios para todo o Brasil.
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-2.5 mt-1">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram MADRI"
                className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:text-[#C4A55C] hover:border-[#C4A55C]/30 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <circle cx="12" cy="12" r="4"/>
                  <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
                </svg>
              </a>
              <a
                href="https://wa.me/5500000000000"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp MADRI"
                className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:text-[#C4A55C] hover:border-[#C4A55C]/30 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.116 1.528 5.845L0 24l6.335-1.508A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.015-1.376l-.36-.214-3.727.977.998-3.647-.233-.375A9.818 9.818 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182c5.43 0 9.818 4.388 9.818 9.818 0 5.43-4.388 9.818-9.818 9.818z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3
              className="text-[10px] tracking-[0.3em] uppercase text-[#C4A55C] mb-5"
              style={{ fontFamily: bodyFont, fontWeight: 600 }}
            >
              Navegação
            </h3>
            <ul className="flex flex-col gap-3">
              {[
                { label: 'Perfumes', href: '/produtos' },
                { label: 'Novidades', href: '/produtos?filter=novo' },
                { label: 'Sobre a MADRI', href: '/sobre' },
                { label: 'Política de Privacidade', href: '/privacidade' },
                { label: 'Termos de Uso', href: '/termos' },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-[12px] text-gray-400 hover:text-white transition-colors"
                    style={{ fontFamily: bodyFont }}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3
              className="text-[10px] tracking-[0.3em] uppercase text-[#C4A55C] mb-5"
              style={{ fontFamily: bodyFont, fontWeight: 600 }}
            >
              Contato
            </h3>
            <ul className="flex flex-col gap-3">
              <li>
                <a
                  href="https://wa.me/5500000000000"
                  className="text-[12px] text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontFamily: bodyFont }}
                >
                  <span className="w-1 h-1 rounded-full bg-[#C4A55C]/50 flex-shrink-0" aria-hidden />
                  WhatsApp
                </a>
              </li>
              <li>
                <a
                  href="mailto:contato@madriperfumes.com.br"
                  className="text-[12px] text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                  style={{ fontFamily: bodyFont }}
                >
                  <span className="w-1 h-1 rounded-full bg-[#C4A55C]/50 flex-shrink-0" aria-hidden />
                  contato@madriperfumes.com.br
                </a>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/[0.06] py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-gray-400">
          <span style={{ fontFamily: bodyFont }}>
            © {new Date().getFullYear()} MADRI Perfumes. Todos os direitos reservados.
          </span>
          <span style={{ fontFamily: bodyFont }}>
            Pagamentos seguros via Mercado Pago
          </span>
        </div>
      </div>

    </footer>
  )
}
