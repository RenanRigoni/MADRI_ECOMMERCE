import Link from 'next/link'
import { requireAdminUser } from '@/lib/admin/auth'
import { readCommerceConfig } from '@/lib/payments/env'
import { createSupabaseAdmin } from '@/lib/server/supabase-admin'
import {
  listAdminOrders,
  getAdminOrderCounters,
  ORDERS_PAGE_SIZE,
  type AdminOrderFilters,
  type AdminOrderPeriod,
  type AdminFulfillmentStatus,
} from '@/lib/admin/orders'
import { paymentStatusBadge, fulfillmentStatusBadge, paymentMethodBadge } from '@/lib/admin/badges'
import type { LocalPaymentStatus } from '@/lib/payments/status'

interface SearchParams {
  q?: string
  payment?: string
  method?: string
  fulfillment?: string
  period?: string
  page?: string
}

const PAYMENT_FILTER_OPTIONS: { value: string; label: string; statuses: LocalPaymentStatus[] }[] = [
  { value: 'paid', label: 'Pago / Aprovado', statuses: ['PAID'] },
  { value: 'pending', label: 'Aguardando', statuses: ['PENDING'] },
  { value: 'processing', label: 'Processando', statuses: ['PROCESSING'] },
  { value: 'rejected', label: 'Falhou / Recusado', statuses: ['REJECTED', 'FAILED'] },
  { value: 'expired', label: 'Expirado', statuses: ['EXPIRED'] },
  { value: 'cancelled', label: 'Cancelado', statuses: ['CANCELLED'] },
  { value: 'refunded', label: 'Reembolsado / Chargeback', statuses: ['REFUNDED', 'PARTIALLY_REFUNDED', 'CHARGEBACK'] },
]

const FULFILLMENT_FILTER_OPTIONS: { value: AdminFulfillmentStatus; label: string }[] = [
  { value: 'READY', label: 'Novo' },
  { value: 'SEPARATING', label: 'Em separação' },
  { value: 'PACKED', label: 'Pronto' },
  { value: 'FULFILLED', label: 'Enviado' },
  { value: 'DELIVERED', label: 'Entregue' },
  { value: 'REVIEW_REQUIRED', label: 'Precisa revisar' },
]

const PERIOD_OPTIONS: { value: AdminOrderPeriod; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
]

function money(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function buildHref(params: SearchParams, overrides: Partial<SearchParams>): string {
  const merged: SearchParams = { ...params, ...overrides }
  const search = new URLSearchParams()
  if (merged.q) search.set('q', merged.q)
  if (merged.payment) search.set('payment', merged.payment)
  if (merged.method) search.set('method', merged.method)
  if (merged.fulfillment) search.set('fulfillment', merged.fulfillment)
  if (merged.period) search.set('period', merged.period)
  if (merged.page && merged.page !== '1') search.set('page', merged.page)
  const qs = search.toString()
  return qs ? `/admin/pedidos?${qs}` : '/admin/pedidos'
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireAdminUser()
  const params = await searchParams
  const supabase = createSupabaseAdmin(readCommerceConfig())

  const page = Math.max(1, Number(params.page) || 1)
  const paymentOption = PAYMENT_FILTER_OPTIONS.find((option) => option.value === params.payment)
  const methodFilter = params.method === 'pix' || params.method === 'card' ? params.method : undefined
  const fulfillmentStatus = FULFILLMENT_FILTER_OPTIONS.find((option) => option.value === params.fulfillment)?.value
  const period = PERIOD_OPTIONS.find((option) => option.value === params.period)?.value

  const filters: AdminOrderFilters = {
    q: params.q,
    paymentStatus: paymentOption?.statuses,
    method: methodFilter,
    fulfillmentStatus,
    period,
    page,
  }

  const [{ orders, total }, counters] = await Promise.all([
    listAdminOrders(supabase, filters),
    getAdminOrderCounters(supabase),
  ])

  const hasActiveFilters = Boolean(params.q || params.payment || params.method || params.fulfillment || params.period)
  const totalPages = Math.max(1, Math.ceil(total / ORDERS_PAGE_SIZE))

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Pedidos ({total})</h1>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 max-w-xl">
        <div className="bg-white border border-[#E8E0D4] p-3">
          <p className="text-xs text-[#6B7280]">Pedidos hoje</p>
          <p className="text-xl font-semibold mt-1">{counters.ordersToday}</p>
        </div>
        <div className="bg-white border border-[#E8E0D4] p-3">
          <p className="text-xs text-[#6B7280]">Aguardando pagamento</p>
          <p className="text-xl font-semibold mt-1">{counters.awaitingPayment}</p>
        </div>
        <div className="bg-white border border-[#E8E0D4] p-3">
          <p className="text-xs text-[#6B7280]">Pagos p/ processar</p>
          <p className="text-xl font-semibold mt-1">{counters.paidToProcess}</p>
        </div>
      </div>

      <form
        method="get"
        key={`${params.q ?? ''}|${params.payment ?? ''}|${params.method ?? ''}|${params.fulfillment ?? ''}|${params.period ?? ''}`}
        className="mt-6 bg-white border border-[#E8E0D4] p-4 flex flex-wrap items-end gap-3"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="q" className="text-xs text-[#6B7280]">Buscar</label>
          <input
            id="q"
            name="q"
            type="text"
            defaultValue={params.q ?? ''}
            placeholder="Pedido, cliente, e-mail, telefone…"
            className="border border-[#D7CFC0] px-3 py-2 text-sm min-w-[220px]"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="payment" className="text-xs text-[#6B7280]">Pagamento</label>
          <select id="payment" name="payment" defaultValue={params.payment ?? ''} className="border border-[#D7CFC0] px-3 py-2 text-sm">
            <option value="">Todos</option>
            {PAYMENT_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="method" className="text-xs text-[#6B7280]">Método</label>
          <select id="method" name="method" defaultValue={params.method ?? ''} className="border border-[#D7CFC0] px-3 py-2 text-sm">
            <option value="">Todos</option>
            <option value="pix">Pix</option>
            <option value="card">Cartão</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="fulfillment" className="text-xs text-[#6B7280]">Status do pedido</label>
          <select id="fulfillment" name="fulfillment" defaultValue={params.fulfillment ?? ''} className="border border-[#D7CFC0] px-3 py-2 text-sm">
            <option value="">Todos</option>
            {FULFILLMENT_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="period" className="text-xs text-[#6B7280]">Período</label>
          <select id="period" name="period" defaultValue={params.period ?? ''} className="border border-[#D7CFC0] px-3 py-2 text-sm">
            <option value="">Todos</option>
            {PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="bg-[#0A0A0A] text-white px-5 py-2 text-sm font-medium">Filtrar</button>
        {hasActiveFilters ? (
          <Link href="/admin/pedidos" className="text-sm underline underline-offset-4 text-[#6B7280]">Limpar filtros</Link>
        ) : null}
      </form>

      {orders.length === 0 ? (
        <p className="mt-8 text-[#6B7280]">Nenhum pedido encontrado.</p>
      ) : (
        <>
          <div className="mt-6 hidden md:block overflow-x-auto border border-[#E8E0D4] bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E8E0D4] text-left text-xs text-[#6B7280] uppercase tracking-wide">
                  <th className="px-4 py-3 font-medium">Pedido</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Pagamento</th>
                  <th className="px-4 py-3 font-medium">Status do pedido</th>
                  <th className="px-4 py-3 font-medium">Método</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E0D4]">
                {orders.map((order) => {
                  const payment = paymentStatusBadge(order.status)
                  const fulfillment = fulfillmentStatusBadge(order.fulfillmentStatus)
                  const method = paymentMethodBadge(order.paymentMethod)
                  return (
                    <tr key={order.id}>
                      <td className="px-4 py-3 font-medium whitespace-nowrap">#{order.publicId.slice(0, 8)}</td>
                      <td className="px-4 py-3">{order.customerName ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs border px-2 py-0.5 uppercase tracking-wide ${payment.className}`}>{payment.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        {order.fulfillmentStatus === 'NOT_READY' ? (
                          <span className="text-[#6B7280]">—</span>
                        ) : (
                          <span className={`text-xs border px-2 py-0.5 uppercase tracking-wide ${fulfillment.className}`}>{fulfillment.label}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">{method.label}</td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium">{money(order.totalCents)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-[#6B7280]">{formatDate(order.createdAt)}</td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/pedidos/${order.id}`} className="text-sm underline underline-offset-4">Ver</Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 md:hidden divide-y divide-[#E8E0D4] border-y border-[#E8E0D4] bg-white">
            {orders.map((order) => {
              const payment = paymentStatusBadge(order.status)
              const fulfillment = fulfillmentStatusBadge(order.fulfillmentStatus)
              const method = paymentMethodBadge(order.paymentMethod)
              return (
                <div key={order.id} className="p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">#{order.publicId.slice(0, 8)}</span>
                    <span className="font-medium">{money(order.totalCents)}</span>
                  </div>
                  <p className="text-sm">{order.customerName ?? '—'}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-xs border px-2 py-0.5 uppercase tracking-wide ${payment.className}`}>{payment.label}</span>
                    {order.fulfillmentStatus !== 'NOT_READY' ? (
                      <span className={`text-xs border px-2 py-0.5 uppercase tracking-wide ${fulfillment.className}`}>{fulfillment.label}</span>
                    ) : null}
                    <span className="text-xs text-[#6B7280]">{method.label}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#6B7280]">{formatDate(order.createdAt)}</span>
                    <Link href={`/admin/pedidos/${order.id}`} className="text-sm underline underline-offset-4">Ver pedido</Link>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-[#6B7280]">Página {page} de {totalPages}</span>
            <div className="flex items-center gap-4">
              {page > 1 ? (
                <Link href={buildHref(params, { page: String(page - 1) })} className="underline underline-offset-4">Anterior</Link>
              ) : (
                <span className="text-[#D7CFC0]">Anterior</span>
              )}
              {page < totalPages ? (
                <Link href={buildHref(params, { page: String(page + 1) })} className="underline underline-offset-4">Próxima</Link>
              ) : (
                <span className="text-[#D7CFC0]">Próxima</span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
