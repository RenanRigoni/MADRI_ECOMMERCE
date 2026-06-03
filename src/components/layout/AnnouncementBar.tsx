'use client'

import { useState, useEffect } from 'react'

const messages = [
  'Frete grátis para compras acima de R$ 300',
  'Pagamento seguro via Mercado Pago e Pix',
  'Embalagem premium com apresentação especial',
]

export default function AnnouncementBar() {
  const [current, setCurrent] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % messages.length)
        setVisible(true)
      }, 350)
    }, 4500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-white border-b border-[#E8E0D4] py-2.5 text-center overflow-hidden">
      <p
        className="text-[10px] tracking-[0.35em] uppercase font-medium transition-all duration-300 ease-in-out"
        style={{
          fontFamily: 'var(--font-body), Montserrat, sans-serif',
          color: '#0A0A0A',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(-4px)',
        }}
      >
        {messages[current]}
      </p>
    </div>
  )
}
