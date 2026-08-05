import type { Metadata } from 'next'
import { Cormorant_Garamond, Montserrat } from 'next/font/google'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
})

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'MADRI Perfumaria | Fragrâncias exclusivas para cada momento',
    template: '%s | MADRI Perfumaria',
  },
  description:
    'Conheça os perfumes MADRI: fragrâncias exclusivas, embalagem premium e envio para todo o Brasil.',
  keywords: ['perfumes', 'fragrâncias', 'perfumaria', 'MADRI', 'perfume exclusivo', 'presente'],
  openGraph: {
    siteName: 'MADRI Perfumaria',
    locale: 'pt_BR',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`h-full ${cormorant.variable} ${montserrat.variable}`}>
      <body className="min-h-full flex flex-col antialiased">
        {children}
      </body>
    </html>
  )
}
