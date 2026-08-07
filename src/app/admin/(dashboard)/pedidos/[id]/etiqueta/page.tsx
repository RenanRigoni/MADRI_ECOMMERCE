import { notFound } from 'next/navigation'
import { requireAdminUser } from '@/lib/admin/auth'
import { readCommerceConfig } from '@/lib/payments/env'
import { createSupabaseAdmin } from '@/lib/server/supabase-admin'
import { getAdminOrder } from '@/lib/admin/orders'
import { PrintButton } from './print-button'

export default async function OrderLabelPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdminUser()
  const { id } = await params
  const orderId = Number(id)
  if (!Number.isInteger(orderId)) notFound()

  const supabase = createSupabaseAdmin(readCommerceConfig())
  const order = await getAdminOrder(supabase, orderId)
  if (!order) notFound()

  const address = order.address

  return (
    <div className="min-h-screen bg-white text-[#0A0A0A] p-8 print:p-0">
      <div className="max-w-md mx-auto print:max-w-none">
        <PrintButton />

        <div className="label border border-[#0A0A0A] p-6 print:border-0">
          <p className="text-xs uppercase tracking-wide text-[#6B7280]">Pedido #{order.publicId.slice(0, 8)}</p>
          <p className="text-2xl font-semibold mt-2">{order.customerName ?? 'Cliente'}</p>
          {order.customerPhone ? <p className="text-lg mt-1">{order.customerPhone}</p> : null}

          {address ? (
            <p className="text-xl mt-4 leading-relaxed">
              {address.street}, {address.number}
              {address.complement ? ` — ${address.complement}` : ''}
              <br />
              {address.neighborhood}
              <br />
              {address.city}/{address.state}
              <br />
              CEP {address.postalCode}
            </p>
          ) : (
            <p className="text-lg mt-4 text-[#B5363A]">Sem endereço registrado</p>
          )}
        </div>
      </div>

      <style>{`
        @page { size: 10cm 15cm; margin: 0.5cm; }
      `}</style>
    </div>
  )
}
