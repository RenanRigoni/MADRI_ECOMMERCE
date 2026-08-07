'use client'

import { type ChangeEvent, type FormEvent, useRef, useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/lib/cart/store'
import { checkoutQuoteSchema, type CheckoutQuoteResponse } from '@/lib/payments/schema'
import MercadoPagoCardBrick from './MercadoPagoCardBrick'

function money(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

interface ViaCepResponse {
  erro?: boolean
  logradouro?: string
  bairro?: string
  localidade?: string
  uf?: string
}

export default function CheckoutFlow({ publicKey, paymentsEnabled }: { publicKey: string | null; paymentsEnabled: boolean }) {
  const cart = useCart()
  const [quote, setQuote] = useState<CheckoutQuoteResponse | null>(null)
  const [payerEmail, setPayerEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cepLookupStatus, setCepLookupStatus] = useState<'idle' | 'loading' | 'not_found'>('idle')
  const formRef = useRef<HTMLFormElement>(null)
  const cepAbortRef = useRef<AbortController | null>(null)

  async function handleCepChange(event: ChangeEvent<HTMLInputElement>) {
    const digits = event.target.value.replace(/\D/g, '')
    if (digits.length !== 8) {
      setCepLookupStatus('idle')
      return
    }

    cepAbortRef.current?.abort()
    const controller = new AbortController()
    cepAbortRef.current = controller
    setCepLookupStatus('loading')

    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`, { signal: controller.signal })
      const data: ViaCepResponse = await response.json()
      if (!response.ok || data.erro) {
        setCepLookupStatus('not_found')
        return
      }
      setCepLookupStatus('idle')
      const form = formRef.current
      if (!form) return
      const street = form.elements.namedItem('street')
      const neighborhood = form.elements.namedItem('neighborhood')
      const city = form.elements.namedItem('city')
      const state = form.elements.namedItem('state')
      if (street instanceof HTMLInputElement) street.value = data.logradouro ?? ''
      if (neighborhood instanceof HTMLInputElement) neighborhood.value = data.bairro ?? ''
      if (city instanceof HTMLInputElement) city.value = data.localidade ?? ''
      if (state instanceof HTMLInputElement) state.value = data.uf ?? ''
      const number = form.elements.namedItem('number')
      if (number instanceof HTMLInputElement) number.focus()
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === 'AbortError') return
      setCepLookupStatus('not_found')
    }
  }

  async function handleQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (loading || cart.items.length === 0) return
    setLoading(true)
    setError(null)

    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') ?? '').trim().toLowerCase()
    try {
      const response = await fetch('/api/checkout/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.items,
          customer: {
            name: String(form.get('name') ?? ''),
            email,
            phone: String(form.get('phone') ?? ''),
            address: {
              postalCode: String(form.get('postalCode') ?? '').replace(/\D/g, ''),
              street: String(form.get('street') ?? ''),
              number: String(form.get('number') ?? ''),
              complement: String(form.get('complement') ?? ''),
              neighborhood: String(form.get('neighborhood') ?? ''),
              city: String(form.get('city') ?? ''),
              state: String(form.get('state') ?? '').trim().toUpperCase(),
            },
          },
        }),
      })
      const payload: unknown = await response.json().catch(() => null)
      const record = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {}
      const parsedQuote = checkoutQuoteSchema.safeParse(record.quote)
      if (!response.ok || !parsedQuote.success) {
        throw new Error(typeof record.error === 'string' ? record.error : 'Não foi possível confirmar o pedido.')
      }
      setPayerEmail(email)
      setQuote(parsedQuote.data)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível confirmar o pedido.')
    } finally {
      setLoading(false)
    }
  }

  if (cart.items.length === 0 && !quote) {
    return (
      <section className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-[family-name:var(--font-display)]">Checkout</h1>
        <p className="mt-5 text-[#6B7280]">Seu carrinho está vazio.</p>
        <Link href="/produtos" className="inline-block mt-6 bg-[#0A0A0A] text-white px-7 py-3 text-xs uppercase tracking-[0.2em]">Ver produtos</Link>
      </section>
    )
  }

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-16">
      <h1 className="text-4xl md:text-5xl font-[family-name:var(--font-display)]">Finalizar pedido</h1>
      {!quote ? (
        <form ref={formRef} onSubmit={handleQuote} className="mt-10 grid lg:grid-cols-[1fr_360px] gap-8">
          <div className="border border-[#E8E0D4] p-5 md:p-8">
            <h2 className="text-xl font-semibold">Contato e entrega</h2>
            <div className="grid sm:grid-cols-2 gap-4 mt-6">
              <label className="sm:col-span-2 text-sm">Nome completo<input required name="name" autoComplete="name" minLength={3} maxLength={120} className="mt-1 w-full border border-[#D4CCBE] px-3 py-2" /></label>
              <label className="text-sm">E-mail<input required type="email" name="email" autoComplete="email" maxLength={254} className="mt-1 w-full border border-[#D4CCBE] px-3 py-2" /></label>
              <label className="text-sm">Telefone<input required name="phone" autoComplete="tel" inputMode="tel" maxLength={20} className="mt-1 w-full border border-[#D4CCBE] px-3 py-2" /></label>
              <label className="text-sm">CEP<input required name="postalCode" autoComplete="postal-code" inputMode="numeric" pattern="[0-9.\- ]{8,10}" maxLength={10} onChange={handleCepChange} className="mt-1 w-full border border-[#D4CCBE] px-3 py-2" />
                {cepLookupStatus === 'loading' ? <span className="mt-1 block text-xs text-[#6B7280]">Buscando endereço…</span> : null}
                {cepLookupStatus === 'not_found' ? <span className="mt-1 block text-xs text-[#B5363A]">CEP não encontrado, preencha manualmente.</span> : null}
              </label>
              <label className="text-sm">Estado<input required name="state" autoComplete="address-level1" pattern="[A-Za-z]{2}" maxLength={2} className="mt-1 w-full border border-[#D4CCBE] px-3 py-2 uppercase" /></label>
              <label className="sm:col-span-2 text-sm">Endereço<input required name="street" autoComplete="address-line1" maxLength={120} className="mt-1 w-full border border-[#D4CCBE] px-3 py-2" /></label>
              <label className="text-sm">Número<input required name="number" maxLength={20} className="mt-1 w-full border border-[#D4CCBE] px-3 py-2" /></label>
              <label className="text-sm">Complemento<input name="complement" autoComplete="address-line2" maxLength={80} className="mt-1 w-full border border-[#D4CCBE] px-3 py-2" /></label>
              <label className="text-sm">Bairro<input required name="neighborhood" maxLength={80} className="mt-1 w-full border border-[#D4CCBE] px-3 py-2" /></label>
              <label className="text-sm">Cidade<input required name="city" autoComplete="address-level2" maxLength={80} className="mt-1 w-full border border-[#D4CCBE] px-3 py-2" /></label>
            </div>
          </div>
          <aside className="bg-[#FAF6F0] border border-[#E8E0D4] p-6 h-fit">
            <h2 className="text-xl font-semibold">Seu pedido</h2>
            <p className="mt-3 text-sm text-[#6B7280]">{cart.count} {cart.count === 1 ? 'item' : 'itens'}. O servidor confirmará preço e estoque.</p>
            {error ? <p role="alert" className="mt-4 text-sm text-[#B5363A]">{error}</p> : null}
            <button disabled={loading} className="w-full mt-6 bg-[#0A0A0A] text-white px-6 py-3 text-xs uppercase tracking-[0.2em] disabled:opacity-60">{loading ? 'Confirmando…' : 'Confirmar pedido'}</button>
          </aside>
        </form>
      ) : (
        <div className="mt-10 grid lg:grid-cols-[1fr_360px] gap-8 items-start">
          <div className="border border-[#E8E0D4] p-5 md:p-8">
            <h2 className="text-xl font-semibold">Pagamento com cartão</h2>
            <p className="mt-2 text-sm text-[#6B7280]">Os dados do cartão são coletados diretamente pelo ambiente seguro do Mercado Pago.</p>
            <div className="mt-6">
              {publicKey && paymentsEnabled ? (
                <MercadoPagoCardBrick publicKey={publicKey} publicOrderId={quote.publicOrderId} totalCents={quote.totalCents} payerEmail={payerEmail} />
              ) : (
                <p role="status" className="border border-[#E8E0D4] bg-[#FAF6F0] p-5 text-sm text-[#6B7280]">Pagamento temporariamente indisponível. A configuração de teste ainda não foi ativada.</p>
              )}
            </div>
          </div>
          <aside className="bg-[#FAF6F0] border border-[#E8E0D4] p-6">
            <h2 className="text-xl font-semibold">Resumo confirmado</h2>
            <ul className="mt-4 divide-y divide-[#E8E0D4]">
              {quote.items.map((item) => <li key={item.productId} className="py-3 flex justify-between gap-4 text-sm"><span>{item.quantity}× {item.name}</span><strong>{money(item.lineTotalCents)}</strong></li>)}
            </ul>
            <div className="mt-4 pt-4 border-t border-[#D4CCBE] space-y-2 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><strong>{money(quote.subtotalCents)}</strong></div>
              <div className="flex justify-between"><span>Frete</span><strong>{quote.shippingCents === 0 ? 'Grátis' : money(quote.shippingCents)}</strong></div>
              <div className="flex justify-between pt-3 border-t border-[#D4CCBE] text-base"><span>Total</span><strong>{money(quote.totalCents)}</strong></div>
            </div>
            <p className="mt-4 text-xs text-[#6B7280]">Cotação válida até {new Date(quote.expiresAt).toLocaleString('pt-BR')}.</p>
          </aside>
        </div>
      )}
    </section>
  )
}
