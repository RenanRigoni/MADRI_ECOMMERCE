'use client'

import { type ComponentProps, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CardPayment, getPaymentMethods, initMercadoPago } from '@mercadopago/sdk-react'
import { useCart } from '@/lib/cart/store'

type CardPaymentSubmit = ComponentProps<typeof CardPayment>['onSubmit']
type CardFormData = Parameters<CardPaymentSubmit>[0]
type AdditionalData = Parameters<CardPaymentSubmit>[1]
type SupportedPaymentType = 'credit_card' | 'debit_card'

interface Props {
  publicKey: string
  publicOrderId: string
  totalCents: number
  payerEmail: string
}

function resultMessage(status: string): string {
  if (status === 'REJECTED') return 'Pagamento recusado. Revise os dados do cartão ou tente outro cartão.'
  if (status === 'FAILED' || status === 'CANCELLED' || status === 'EXPIRED') return 'Não foi possível autorizar o pagamento.'
  return 'Não foi possível confirmar o pagamento agora.'
}

async function resolvePaymentType(
  formData: CardFormData,
  additionalData: AdditionalData,
  lastBin: string,
): Promise<SupportedPaymentType> {
  let paymentTypeId = additionalData?.paymentTypeId
  const bin = additionalData?.bin || lastBin

  if (!paymentTypeId && bin) {
    const methods = await getPaymentMethods({ bin })
    paymentTypeId = methods?.results.find((method) => method.id === formData.payment_method_id)?.payment_type_id
  }

  if (paymentTypeId !== 'credit_card' && paymentTypeId !== 'debit_card') {
    throw new Error('Não foi possível identificar o tipo do cartão. Revise os dados e tente novamente.')
  }
  return paymentTypeId
}

export default function MercadoPagoCardBrick({ publicKey, publicOrderId, totalCents, payerEmail }: Props) {
  const router = useRouter()
  const { clear } = useCart()
  const attemptId = useRef(crypto.randomUUID())
  const submitting = useRef(false)
  const lastBin = useRef('')
  const submissionError = useRef<string | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'submitting' | 'error'>('loading')
  const [message, setMessage] = useState('Carregando pagamento seguro…')
  const [requiresNewQuote, setRequiresNewQuote] = useState(false)

  useEffect(() => {
    initMercadoPago(publicKey, { locale: 'pt-BR' })
  }, [publicKey])

  const initialization = useMemo(() => ({
    amount: totalCents / 100,
    payer: { email: payerEmail },
  }), [payerEmail, totalCents])

  const customization = useMemo(() => ({
    paymentMethods: {
      maxInstallments: 12,
      types: { included: ['credit_card', 'debit_card'] as ('credit_card' | 'debit_card')[] },
    },
    visual: { style: { theme: 'default' as const } },
  }), [])

  const onReady = useCallback(() => {
    setStatus('ready')
    setMessage('Ambiente seguro do Mercado Pago carregado.')
  }, [])

  const onError = useCallback(() => {
    setStatus('error')
    setMessage(submissionError.current ?? 'Não foi possível carregar o formulário de pagamento. Atualize a página e tente novamente.')
    submissionError.current = null
  }, [])

  const onBinChange = useCallback((bin: string) => {
    lastBin.current = bin
  }, [])

  const onSubmit: CardPaymentSubmit = useCallback(async (formData, additionalData) => {
    if (submitting.current) throw new Error('Uma tentativa de pagamento já está em processamento.')
    submitting.current = true
    setStatus('submitting')
    setMessage('Processando pagamento… Não feche esta página.')

    try {
      const identification = formData.payer.identification
      if (!identification || !['CPF', 'CNPJ'].includes(identification.type)) {
        throw new Error('O CPF ou CNPJ não foi recebido do formulário seguro. Revise os dados e tente novamente.')
      }
      const paymentTypeId = await resolvePaymentType(formData, additionalData, lastBin.current)

      const response = await fetch('/api/payments/mercadopago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicOrderId,
          attemptId: attemptId.current,
          payment: {
            token: formData.token,
            paymentMethodId: formData.payment_method_id,
            paymentTypeId,
            installments: formData.installments,
            payer: {
              identification: { type: identification.type, number: identification.number.replace(/\D/g, '') },
            },
          },
        }),
      })
      const result: unknown = await response.json().catch(() => null)
      const record = result && typeof result === 'object' ? result as Record<string, unknown> : {}
      const nextStatus = typeof record.status === 'string' ? record.status : null

      if (!response.ok && response.status !== 202) {
        if (response.status === 409 || response.status === 422) setRequiresNewQuote(true)
        throw new Error(typeof record.error === 'string' ? record.error : 'Não foi possível processar o pagamento.')
      }
      if (!nextStatus) throw new Error('Não foi possível confirmar o pagamento agora.')

      if (['PAID', 'PENDING', 'PROCESSING', 'UNKNOWN'].includes(nextStatus)) {
        clear()
        router.push(`/pedido/${publicOrderId}`)
        return
      }

      // Terminal failure (REJECTED/FAILED/CANCELLED/EXPIRED): this attempt is now
      // permanently tied to that outcome in the DB (provider_order_id is set), so
      // reusing attemptId.current on a resubmit would just re-fetch this same
      // declined result instead of charging whatever card the customer retries
      // with. Mint a fresh id so the Brick (which stays mounted) can actually retry.
      attemptId.current = crypto.randomUUID()
      setRequiresNewQuote(true)
      throw new Error(resultMessage(nextStatus))
    } catch (error) {
      const publicMessage = error instanceof Error
        ? error.message
        : 'Não foi possível processar o pagamento. Tente novamente.'
      setStatus('error')
      setMessage(publicMessage)
      submissionError.current = publicMessage
      throw error instanceof Error ? error : new Error(publicMessage)
    } finally {
      submitting.current = false
    }
  }, [clear, publicOrderId, router])

  return (
    <div aria-busy={status === 'submitting'}>
      <p role="status" aria-live="polite" className={`mb-4 text-sm ${status === 'error' ? 'text-[#B5363A]' : 'text-[#4A4A4A]'}`}>{message}</p>
      {requiresNewQuote ? (
        <button type="button" onClick={() => window.location.reload()} className="mb-5 border border-[#0A0A0A] px-5 py-2 text-xs uppercase tracking-[0.15em]">
          Criar nova tentativa
        </button>
      ) : null}
      <CardPayment
        id={`card-payment-${publicOrderId}`}
        initialization={initialization}
        customization={customization}
        locale="pt-BR"
        onReady={onReady}
        onError={onError}
        onBinChange={onBinChange}
        onSubmit={onSubmit}
      />
    </div>
  )
}
