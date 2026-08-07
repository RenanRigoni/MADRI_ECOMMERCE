import Link from 'next/link'
import { requireAdminUser } from '@/lib/admin/auth'
import { readCommerceConfig } from '@/lib/payments/env'
import { createSupabaseAdmin } from '@/lib/server/supabase-admin'
import { listAdminOrders, type AdminOrderRow } from '@/lib/admin/orders'
import { markOrderFulfilled } from './actions'

type StatusFilter = 'pago' | 'processando' | 'atencao' | 'cancelado'

interface SearchParams {
  q?: string
  status?: StatusFilter
}

function money(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleString('pt-BR')
}

function statusBadge(status: string): { label: string; className: string } {
  if (status === 'PAID') return { label: 'Pago', className: 'text-[#2D6A4F] border-[#2D6A4F]' }
  if (status === 'PROCESSING' || status === 'PENDING') return { label: 'Processando', className: 'text-[#6B7280] border-[#D7CFC0]' }
  if (['EXPIRED', 'REJECTED', 'CANCELLED', 'FAILED'].includes(status)) {
    return { label: status === 'EXPIRED' ? 'Expirado' : status === 'REJECTED' ? 'Recusado' : status === 'CANCELLED' ? 'Cancelado' : 'Falhou', className: 'text-[#B5363A] border-[#B5363A]' }
  }
  return { label: status, className: 'text-[#6B7280] border-[#D7CFC0]' }
}

function matchesStatusFilter(order: AdminOrderRow, filter: StatusFilter | undefined): boolean {
  if (!filter) return true
  if (filter === 'pago') return order.status === 'PAID'
  if (filter === 'processando') return order.status === 'PROCESSING' || order.status === 'PENDING'
  if (filter === 'atencao') return order.fulfillmentStatus === 'REVIEW_REQUIRED'
  if (filter === 'cancelado') return ['EXPIRED', 'REJECTED', 'CANCELLED', 'FAILED'].includes(order.status)
  return true
}

function applyFilters(orders: AdminOrderRow[], params: SearchParams): AdminOrderRow[] {
  const query = params.q?.trim().toLowerCase()
  return orders.filter((order) => {
    if (!matchesStatusFilter(order, params.status)) return false
    if (query) {
      const haystack = `${order.customerName ?? ''} ${order.customerEmail ?? ''}`.toLowerCase()
      if (!haystack.includes(query)) return false
    }
    return true
  })
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireAdminUser()
  const params = await searchParams
  const supabase = createSupabaseAdmin(readCommerceConfig())
  const allOrders = await listAdminOrders(supabase)
  const filtered = applyFilters(allOrders, params)
  const hasActiveFilters = Boolean(params.q || params.status)

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          Pedidos ({filtered.length}{hasActiveFilters ? ` de ${allOrders.length}` : ''})
        </h1>
      </div>

      <form
        method="get"
        key={`${params.q ?? ''}|${params.status ?? ''}`}
        className="mt-6 bg-white border border-[#E8E0D4] p-4 flex flex-wrap items-end gap-3"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="q" className="text-xs text-[#6B7280]">Buscar cliente</label>
          <input
            id="q"
            name="q"
            type="text"
            defaultValue={params.q ?? ''}
            placeholder="Nome ou e-mail…"
            className="border border-[#D7CFC0] px-3 py-2 text-sm min-w-[200px]"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="status" className="text-xs text-[#6B7280]">Status</label>
          <select id="status" name="status" defaultValue={params.status ?? ''} className="border border-[#D7CFC0] px-3 py-2 text-sm">
            <option value="">Todos</option>
            <option value="pago">Pago</option>
            <option value="processando">Processando</option>
            <option value="atencao">Precisa atenção</option>
            <option value="cancelado">Cancelado / expirado</option>
          </select>
        </div>
        <button type="submit" className="bg-[#0A0A0A] text-white px-5 py-2 text-sm font-medium">Filtrar</button>
        {hasActiveFilters ? (
          <Link href="/admin/pedidos" className="text-sm underline underline-offset-4 text-[#6B7280]">Limpar filtros</Link>
        ) : null}
      </form>

      {filtered.length === 0 ? (
        <p className="mt-8 text-[#6B7280]">Nenhum pedido encontrado.</p>
      ) : (
        <div className="mt-6 divide-y divide-[#E8E0D4] border-y border-[#E8E0D4] bg-white">
          {filtered.map((order) => {
            const badge = statusBadge(order.status)
            const canFulfill = order.status === 'PAID' && order.fulfillmentStatus === 'READY'
            return (
              <div key={order.id} className="p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="font-medium">#{order.publicId.slice(0, 8)}</span>
                    <span className={`ml-3 text-xs border px-2 py-0.5 uppercase tracking-wide ${badge.className}`}>{badge.label}</span>
                    {order.fulfillmentStatus === 'REVIEW_REQUIRED' ? (
                      <span className="ml-2 text-xs border border-[#B5363A] text-[#B5363A] px-2 py-0.5 uppercase tracking-wide">Revisar</span>
                    ) : null}
                    {order.paymentMethod ? (
                      <span className="ml-2 text-xs border border-[#D7CFC0] text-[#6B7280] px-2 py-0.5 uppercase tracking-wide">
                        {order.paymentMethod === 'pix' ? 'Pix' : 'Cartão'}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-sm text-[#6B7280]">
                    Pedido em {formatDate(order.createdAt)}{order.paidAt ? ` · Pago em ${formatDate(order.paidAt)}` : ''}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">{order.customerName ?? '—'}</p>
                    <p className="text-[#6B7280]">{order.customerEmail ?? '—'}</p>
                    <p className="text-[#6B7280]">{order.customerPhone ?? '—'}</p>
                  </div>
                  <div>
                    {order.address ? (
                      <p className="text-[#4A4A4A]">
                        {order.address.street}, {order.address.number}
                        {order.address.complement ? ` — ${order.address.complement}` : ''}
                        <br />
                        {order.address.neighborhood} · {order.address.city}/{order.address.state}
                        <br />
                        CEP {order.address.postalCode}
                      </p>
                    ) : (
                      <p className="text-[#6B7280]">Sem endereço registrado</p>
                    )}
                  </div>
                </div>

                <ul className="text-sm divide-y divide-[#E8E0D4]">
                  {order.items.map((item) => (
                    <li key={item.productId} className="py-1.5 flex justify-between gap-4">
                      <span>{item.quantity}× {item.productName}</span>
                      <strong>{money(item.lineTotalCents)}</strong>
                    </li>
                  ))}
                </ul>

                <div className="flex items-center justify-between">
                  <p className="text-sm">
                    Subtotal {money(order.subtotalCents)} · Frete {order.shippingCents === 0 ? 'Grátis' : money(order.shippingCents)}
                    <strong className="ml-2">Total {money(order.totalCents)}</strong>
                  </p>
                  <div className="flex items-center gap-2">
                    {order.status === 'PAID' ? (
                      <Link
                        href={`/admin/pedidos/${order.id}/etiqueta`}
                        target="_blank"
                        className="text-sm px-3 py-1.5 border border-[#D7CFC0] text-[#4A4A4A]"
                      >
                        Imprimir etiqueta
                      </Link>
                    ) : null}
                    {canFulfill ? (
                      <form action={markOrderFulfilled.bind(null, order.id)}>
                        <button type="submit" className="text-sm px-3 py-1.5 border border-[#2D6A4F] text-[#2D6A4F]">
                          Marcar como enviado
                        </button>
                      </form>
                    ) : order.fulfillmentStatus === 'FULFILLED' ? (
                      <span className="text-sm text-[#2D6A4F]">Enviado</span>
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
