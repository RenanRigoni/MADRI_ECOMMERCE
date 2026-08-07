'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { publicOrderSchema, type PublicOrderResponse } from '@/lib/payments/schema'

const TERMINAL = new Set(['PAID', 'REJECTED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'EXPIRED', 'CHARGEBACK', 'FAILED'])

function heading(status: string): string {
  if (status === 'PAID') return 'Pagamento confirmado'
  if (status === 'REJECTED') return 'Pagamento recusado'
  if (status === 'REFUNDED' || status === 'PARTIALLY_REFUNDED') return 'Pagamento reembolsado'
  if (status === 'CHARGEBACK') return 'Pagamento em análise'
  if (status === 'FAILED' || status === 'CANCELLED' || status === 'EXPIRED') return 'Pagamento não concluído'
  return 'Pagamento em processamento'
}

export default function OrderStatus({ publicOrderId }: { publicOrderId: string }) {
  const [order, setOrder] = useState<PublicOrderResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    let timer: ReturnType<typeof setTimeout> | undefined

    async function refresh() {
      try {
        const response = await fetch(`/api/orders/${encodeURIComponent(publicOrderId)}`, { cache: 'no-store' })
        const payload: unknown = await response.json().catch(() => null)
        const record = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {}
        const parsedOrder = publicOrderSchema.safeParse(record.order)
        if (!response.ok || !parsedOrder.success) throw new Error('Pedido não encontrado.')
        if (!active) return
        const next = parsedOrder.data
        setOrder(next)
        setError(null)
        if (!TERMINAL.has(next.status)) timer = setTimeout(refresh, 5_000)
      } catch (caught) {
        if (!active) return
        setError(caught instanceof Error ? caught.message : 'Não foi possível consultar o pedido.')
        timer = setTimeout(refresh, 5_000)
      }
    }

    void refresh()
    return () => { active = false; if (timer) clearTimeout(timer) }
  }, [publicOrderId])

  return (
    <section className="max-w-3xl mx-auto px-4 py-16">
      <div className="border border-[#E8E0D4] bg-[#FAF6F0] p-6 md:p-10">
        {error ? <><h1 className="text-3xl font-[family-name:var(--font-display)]">Não foi possível consultar o pedido</h1><p role="alert" className="mt-4 text-[#B5363A]">{error}</p></> : order ? <>
          <p className="text-xs uppercase tracking-[0.25em] text-[#8A6A2F]">Pedido {order.publicOrderId.slice(0, 8).toUpperCase()}</p>
          <h1 className="mt-3 text-4xl font-[family-name:var(--font-display)]">{heading(order.status)}</h1>
          <p role="status" className="mt-4 text-[#4A4A4A]">Status: <strong>{order.status}</strong></p>
          <ul className="mt-8 divide-y divide-[#E8E0D4] border-y border-[#E8E0D4]">
            {order.items.map((item) => <li key={item.productId} className="py-3 flex justify-between gap-4 text-sm"><span>{item.quantity}× {item.name}</span><strong>{(item.lineTotalCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></li>)}
          </ul>
        </> : <><h1 className="text-3xl font-[family-name:var(--font-display)]">Consultando pagamento…</h1><p role="status" className="mt-4 text-[#6B7280]">Aguarde um instante.</p></>}
        <Link href="/produtos" className="inline-block mt-8 text-xs uppercase tracking-[0.2em] underline underline-offset-4">Voltar à loja</Link>
      </div>
    </section>
  )
}
