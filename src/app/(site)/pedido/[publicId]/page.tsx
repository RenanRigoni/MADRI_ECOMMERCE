import type { Metadata } from 'next'
import OrderStatus from '@/components/checkout/OrderStatus'

export const metadata: Metadata = { title: 'Status do pedido' }

export default async function OrderPage({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params
  return <OrderStatus publicOrderId={publicId} />
}
