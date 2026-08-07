import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdminUser } from '@/lib/admin/auth'
import { readCommerceConfig } from '@/lib/payments/env'
import { createSupabaseAdmin } from '@/lib/server/supabase-admin'
import { getAdminOrder, type AdminOrderDetail } from '@/lib/admin/orders'
import { paymentStatusBadge, fulfillmentStatusBadge, paymentMethodBadge, FULFILLMENT_NEXT_STAGE } from '@/lib/admin/badges'
import { advanceFulfillmentStatus } from './actions'

function money(cents: number | null): string {
  if (cents === null) return '—'
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDateTime(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleString('pt-BR')
}

function paymentTerminalLabel(status: AdminOrderDetail['status']): string {
  switch (status) {
    case 'PAID': return 'Pagamento aprovado'
    case 'REJECTED': return 'Pagamento recusado'
    case 'FAILED': return 'Pagamento falhou'
    case 'CANCELLED': return 'Pagamento cancelado'
    case 'EXPIRED': return 'Pagamento expirado'
    case 'REFUNDED': return 'Pagamento reembolsado'
    case 'PARTIALLY_REFUNDED': return 'Pagamento parcialmente reembolsado'
    case 'CHARGEBACK': return 'Chargeback recebido'
    default: return ''
  }
}

function buildTimeline(order: AdminOrderDetail): { label: string; at: string }[] {
  const events: { label: string; at: string }[] = [
    { label: 'Pedido criado', at: order.createdAt },
  ]
  if (order.payment?.createdAt) {
    const methodLabel = order.payment.paymentTypeId === 'bank_transfer' ? 'Pix' : 'Cartão'
    events.push({ label: `Pagamento ${methodLabel} iniciado`, at: order.payment.createdAt })
  }
  if (order.payment?.completedAt && !['PENDING', 'PROCESSING'].includes(order.status)) {
    const label = paymentTerminalLabel(order.status)
    if (label) events.push({ label, at: order.payment.completedAt })
  }
  if (order.fulfillmentUpdatedAt && order.fulfillmentStatus !== 'NOT_READY') {
    events.push({
      label: `Status atual: ${fulfillmentStatusBadge(order.fulfillmentStatus).label}`,
      at: order.fulfillmentUpdatedAt,
    })
  }
  return events.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
}

export default async function AdminOrderDetailPage({
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

  const payment = paymentStatusBadge(order.status)
  const fulfillment = fulfillmentStatusBadge(order.fulfillmentStatus)
  const method = paymentMethodBadge(order.paymentMethod)
  const nextStage = FULFILLMENT_NEXT_STAGE[order.fulfillmentStatus]
  const canAdvance = order.status === 'PAID' && Boolean(nextStage)
  const timeline = buildTimeline(order)
  const address = order.address

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <Link href="/admin/pedidos" className="text-sm text-[#6B7280] underline underline-offset-4">← Pedidos</Link>
          <h1 className="text-2xl font-semibold mt-1">Pedido #{order.publicId.slice(0, 8)}</h1>
        </div>
        {order.status === 'PAID' ? (
          <Link
            href={`/admin/pedidos/${order.id}/etiqueta`}
            target="_blank"
            className="text-sm px-3 py-1.5 border border-[#D7CFC0] text-[#4A4A4A]"
          >
            Imprimir etiqueta
          </Link>
        ) : null}
      </div>

      <section className="mt-6 bg-white border border-[#E8E0D4] p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#6B7280]">Pagamento</h2>
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <p className="text-[#6B7280]">Método</p>
          <p>{method.label}</p>
          <p className="text-[#6B7280]">Status</p>
          <p><span className={`text-xs border px-2 py-0.5 uppercase tracking-wide ${payment.className}`}>{payment.label}</span></p>
          <p className="text-[#6B7280]">Provedor</p>
          <p>Mercado Pago</p>
          {order.providerOrderId ? (
            <>
              <p className="text-[#6B7280]">Mercado Pago Order</p>
              <p className="font-mono text-xs">{order.providerOrderId}</p>
            </>
          ) : null}
          <p className="text-[#6B7280]">Referência interna</p>
          <p className="font-mono text-xs">{order.externalReference}</p>
          <p className="text-[#6B7280]">Valor</p>
          <p>{money(order.payment?.amountCents ?? order.totalCents)}</p>
          {order.payment?.installments && order.payment.installments > 1 ? (
            <>
              <p className="text-[#6B7280]">Parcelas</p>
              <p>{order.payment.installments}x</p>
            </>
          ) : null}
          <p className="text-[#6B7280]">Criado em</p>
          <p>{formatDateTime(order.payment?.createdAt ?? order.createdAt)}</p>
          <p className="text-[#6B7280]">Aprovado em</p>
          <p>{formatDateTime(order.paidAt)}</p>
          {order.payment?.providerStatusDetail && order.status !== 'PAID' && order.status !== 'PENDING' ? (
            <>
              <p className="text-[#6B7280]">Detalhe</p>
              <p>{order.payment.providerStatusDetail}</p>
            </>
          ) : null}
        </div>
      </section>

      <section className="mt-4 bg-white border border-[#E8E0D4] p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#6B7280]">Cliente</h2>
        <div className="mt-3 text-sm space-y-1">
          <p className="font-medium">{order.customerName ?? '—'}</p>
          <p className="text-[#6B7280]">{order.customerEmail ?? '—'}</p>
          <p className="text-[#6B7280]">{order.customerPhone ?? '—'}</p>
        </div>
      </section>

      <section className="mt-4 bg-white border border-[#E8E0D4] p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#6B7280]">Entrega</h2>
        {address ? (
          <p className="mt-3 text-sm text-[#4A4A4A] leading-relaxed">
            {address.street}, {address.number}
            {address.complement ? ` — ${address.complement}` : ''}
            <br />
            {address.neighborhood} · {address.city}/{address.state}
            <br />
            CEP {address.postalCode}
          </p>
        ) : (
          <p className="mt-3 text-sm text-[#6B7280]">Sem endereço registrado</p>
        )}
      </section>

      <section className="mt-4 bg-white border border-[#E8E0D4] p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#6B7280]">Produtos</h2>
        <ul className="mt-3 text-sm divide-y divide-[#E8E0D4]">
          {order.items.map((item) => (
            <li key={item.productId} className="py-2 flex justify-between gap-4">
              <span>{item.quantity}× {item.productName}</span>
              <span className="text-[#6B7280]">{money(item.unitPriceCents)} un. · <strong className="text-[#0A0A0A]">{money(item.lineTotalCents)}</strong></span>
            </li>
          ))}
        </ul>
        <div className="mt-3 pt-3 border-t border-[#E8E0D4] text-sm space-y-1">
          <div className="flex justify-between"><span className="text-[#6B7280]">Produtos</span><span>{money(order.subtotalCents)}</span></div>
          <div className="flex justify-between"><span className="text-[#6B7280]">Frete</span><span>{order.shippingCents === 0 ? 'Grátis' : money(order.shippingCents)}</span></div>
          <div className="flex justify-between font-semibold text-base"><span>Total</span><span>{money(order.totalCents)}</span></div>
        </div>
      </section>

      <section className="mt-4 bg-white border border-[#E8E0D4] p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#6B7280]">Histórico</h2>
        <ul className="mt-3 text-sm space-y-2">
          {timeline.map((event, index) => (
            <li key={index} className="flex gap-3">
              <span className="text-[#6B7280] whitespace-nowrap">{formatDateTime(event.at)}</span>
              <span>{event.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-4 bg-white border border-[#E8E0D4] p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#6B7280]">Status do pedido</h2>
        <div className="mt-3 flex items-center gap-3">
          {order.fulfillmentStatus === 'NOT_READY' ? (
            <span className="text-sm text-[#6B7280]">Aguardando confirmação de pagamento</span>
          ) : (
            <span className={`text-xs border px-2 py-0.5 uppercase tracking-wide ${fulfillment.className}`}>{fulfillment.label}</span>
          )}
          {canAdvance && nextStage ? (
            <form action={advanceFulfillmentStatus.bind(null, order.id, nextStage)}>
              <button type="submit" className="text-sm px-3 py-1.5 border border-[#2D6A4F] text-[#2D6A4F]">
                Avançar para: {fulfillmentStatusBadge(nextStage).label}
              </button>
            </form>
          ) : null}
        </div>
      </section>
    </div>
  )
}
