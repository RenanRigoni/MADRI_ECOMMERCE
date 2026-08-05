import type { Metadata } from 'next'
import CartPageClient from '@/components/checkout/CartPageClient'

export const metadata: Metadata = { title: 'Carrinho' }

export default function CartPage() {
  return <CartPageClient />
}
