'use client'

import { type FormEvent, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/cart/store'

interface Props {
  publicOrderId: string
  totalCents: number
  payerEmail: string
}

interface PixData {
  qrCodeBase64: string | null
  qrCode: string | null
  ticketUrl: string | null
}

const TERMINAL_FAILURE_STATUSES = new Set(['REJECTED', 'CANCELLED', 'EXPIRED', 'FAILED'])
// Our webhook reconciliation is not reliable yet (see BUGS.md Bug #3), so polling re-calls
// the payment endpoint itself (not a passive status read) to force a fresh authoritative
// check with Mercado Pago. Interval is kept above 12s to stay under the 5-requests/60s
// payment rate limit shared with the initial "Gerar Pix" call.
const POLL_INTERVAL_MS = 15_000

function money(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '')
}

export default function MercadoPagoPixPayment({ publicOrderId, totalCents, payerEmail }: Props) {
  const router = useRouter()
  const { clear } = useCart()
  const attemptId = useRef(crypto.randomUUID())
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const [status, setStatus] = useState<'form' | 'generating' | 'waiting' | 'error'>('form')
  const [message, setMessage] = useState<string | null>(null)
  const [pix, setPix] = useState<PixData | null>(null)
  const [copied, setCopied] = useState(false)
  const [docType, setDocType] = useState<'CPF' | 'CNPJ'>('CPF')
  const submittedIdentification = useRef<{ type: 'CPF' | 'CNPJ'; number: string } | null>(null)

  useEffect(() => {
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current)
    }
  }, [])

  function stopPolling() {
    if (pollTimer.current) {
      clearInterval(pollTimer.current)
      pollTimer.current = null
    }
  }

  function startPolling() {
    stopPolling()
    pollTimer.current = setInterval(async () => {
      const identification = submittedIdentification.current
      if (!identification) return
      try {
        const response = await fetch('/api/payments/mercadopago', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            publicOrderId,
            attemptId: attemptId.current,
            payment: {
              paymentTypeId: 'bank_transfer',
              paymentMethodId: 'pix',
              payer: { identification },
            },
          }),
        })
        if (!response.ok && response.status !== 202) return
        const payload: unknown = await response.json().catch(() => null)
        const record = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {}
        const orderStatus = typeof record.status === 'string' ? record.status : null

        if (orderStatus === 'PAID') {
          stopPolling()
          clear()
          router.push(`/pedido/${publicOrderId}`)
          return
        }
        if (orderStatus && TERMINAL_FAILURE_STATUSES.has(orderStatus)) {
          stopPolling()
          setStatus('error')
          setMessage('O Pix expirou ou não foi confirmado. Gere um novo código para tentar de novo.')
        }
      } catch {
        // transient network error during polling — keep trying on the next tick
      }
    }, POLL_INTERVAL_MS)
  }

  async function handleGeneratePix(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status === 'generating') return
    setStatus('generating')
    setMessage(null)

    const form = new FormData(event.currentTarget)
    const document = onlyDigits(String(form.get('document') ?? ''))
    const identification = { type: docType, number: document }
    submittedIdentification.current = identification

    try {
      const response = await fetch('/api/payments/mercadopago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicOrderId,
          attemptId: attemptId.current,
          payment: {
            paymentTypeId: 'bank_transfer',
            paymentMethodId: 'pix',
            payer: { identification },
          },
        }),
      })
      const result: unknown = await response.json().catch(() => null)
      const record = result && typeof result === 'object' ? result as Record<string, unknown> : {}
      const nextStatus = typeof record.status === 'string' ? record.status : null

      if (!response.ok && response.status !== 202) {
        throw new Error(typeof record.error === 'string' ? record.error : 'Não foi possível gerar o Pix.')
      }
      if (nextStatus === 'PAID') {
        clear()
        router.push(`/pedido/${publicOrderId}`)
        return
      }

      const pixPayload = record.pix && typeof record.pix === 'object' ? record.pix as Record<string, unknown> : null
      if (!pixPayload || (!pixPayload.qrCodeBase64 && !pixPayload.qrCode)) {
        throw new Error('Não foi possível gerar o QR Code do Pix agora. Tente novamente.')
      }

      setPix({
        qrCodeBase64: typeof pixPayload.qrCodeBase64 === 'string' ? pixPayload.qrCodeBase64 : null,
        qrCode: typeof pixPayload.qrCode === 'string' ? pixPayload.qrCode : null,
        ticketUrl: typeof pixPayload.ticketUrl === 'string' ? pixPayload.ticketUrl : null,
      })
      setStatus('waiting')
      startPolling()
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Não foi possível gerar o Pix. Tente novamente.')
    }
  }

  async function handleCopy() {
    if (!pix?.qrCode) return
    try {
      await navigator.clipboard.writeText(pix.qrCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch {
      setMessage('Não foi possível copiar automaticamente. Selecione o código manualmente.')
    }
  }

  if (status === 'waiting' && pix) {
    return (
      <div>
        <p role="status" aria-live="polite" className="mb-4 text-sm text-[#4A4A4A]">Aguardando pagamento… Isso pode levar alguns minutos após você pagar.</p>
        {pix.qrCodeBase64 ? (
          <img
            src={`data:image/png;base64,${pix.qrCodeBase64}`}
            alt="QR Code para pagamento via Pix"
            width={240}
            height={240}
            className="mx-auto border border-[#E8E0D4]"
          />
        ) : null}
        {pix.qrCode ? (
          <div className="mt-5">
            <label className="text-sm">Pix Copia e Cola
              <textarea readOnly value={pix.qrCode} rows={3} className="mt-1 w-full border border-[#D4CCBE] px-3 py-2 text-xs" />
            </label>
            <button type="button" onClick={handleCopy} className="mt-2 w-full border border-[#0A0A0A] px-5 py-2 text-xs uppercase tracking-[0.15em]">
              {copied ? 'Código copiado!' : 'Copiar código Pix'}
            </button>
          </div>
        ) : null}
        {pix.ticketUrl ? (
          <a href={pix.ticketUrl} target="_blank" rel="noopener noreferrer" className="mt-3 block text-center text-xs text-[#6B7280] underline">
            Abrir instruções de pagamento
          </a>
        ) : null}
        <p className="mt-4 text-center text-sm">Total: <strong>{money(totalCents)}</strong></p>
      </div>
    )
  }

  return (
    <form onSubmit={handleGeneratePix}>
      {message ? <p role="alert" className="mb-4 text-sm text-[#B5363A]">{message}</p> : null}
      <div className="grid grid-cols-[100px_1fr] gap-3">
        <label className="text-sm">Documento
          <select
            value={docType}
            onChange={(event) => setDocType(event.target.value === 'CNPJ' ? 'CNPJ' : 'CPF')}
            className="mt-1 w-full border border-[#D4CCBE] px-2 py-2"
          >
            <option value="CPF">CPF</option>
            <option value="CNPJ">CNPJ</option>
          </select>
        </label>
        <label className="text-sm">{docType === 'CPF' ? 'Número do CPF' : 'Número do CNPJ'}
          <input
            required
            name="document"
            inputMode="numeric"
            maxLength={18}
            placeholder={docType === 'CPF' ? '000.000.000-00' : '00.000.000/0000-00'}
            className="mt-1 w-full border border-[#D4CCBE] px-3 py-2"
          />
        </label>
      </div>
      <p className="mt-4 text-sm">Total: <strong>{money(totalCents)}</strong></p>
      <button disabled={status === 'generating'} className="w-full mt-5 bg-[#0A0A0A] text-white px-6 py-3 text-xs uppercase tracking-[0.2em] disabled:opacity-60">
        {status === 'generating' ? 'Gerando…' : 'Gerar Pix'}
      </button>
      <p className="mt-3 text-xs text-[#6B7280]">Pagador: {payerEmail}</p>
    </form>
  )
}
