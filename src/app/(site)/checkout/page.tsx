import type { Metadata } from 'next'
import CheckoutFlow from '@/components/checkout/CheckoutFlow'

export const metadata: Metadata = { title: 'Checkout seguro' }

export default function CheckoutPage() {
  const publicKey = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY?.trim() || null
  const paymentsEnabled = process.env.MERCADO_PAGO_PAYMENTS_ENABLED === 'true'
  return <CheckoutFlow publicKey={publicKey} paymentsEnabled={paymentsEnabled} />
}
