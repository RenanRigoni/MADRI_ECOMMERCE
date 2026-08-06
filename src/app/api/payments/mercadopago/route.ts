import { z } from 'zod'
import type { NextRequest } from 'next/server'
import { createMercadoPagoOrder, getMercadoPagoOrder, MercadoPagoApiError } from '@/lib/mercadopago/orders-client'
import { mapMercadoPagoStatus } from '@/lib/payments/status'
import { readMercadoPagoConfig } from '@/lib/payments/env'
import { createPaymentFingerprint } from '@/lib/payments/fingerprint'
import { PaymentPersistenceError, PaymentRepository } from '@/lib/payments/repository'
import { paymentRequestSchema } from '@/lib/payments/schema'
import { logPaymentEvent } from '@/lib/payments/safe-log'
import { apiJson, unavailableResponse } from '@/lib/server/api-response'
import { readGuestSession, rateLimitKey } from '@/lib/server/guest-session'
import { assertSameOrigin, InvalidRequestError, readJsonBody } from '@/lib/server/http'
import { createSupabaseAdmin } from '@/lib/server/supabase-admin'

export const runtime = 'nodejs'

function paymentStatusCode(status: string): number {
  return status === 'PENDING' || status === 'PROCESSING' || status === 'UNKNOWN' ? 202 : 200
}

function persistenceFailure(error: PaymentPersistenceError) {
  if (error.code === 'order_not_found') return apiJson({ error: 'Pedido não encontrado.' }, 404)
  if (error.code === 'quote_expired' || error.code === 'quote_changed') {
    return apiJson({ error: 'A cotação expirou ou o preço mudou. Revise o carrinho.' }, 409)
  }
  if (error.code === 'out_of_stock') return apiJson({ error: 'Um item não possui mais estoque.' }, 409)
  if (['attempt_conflict', 'payment_in_progress', 'order_not_payable'].includes(error.code)) {
    return apiJson({ error: 'Este pedido já possui uma tentativa de pagamento.' }, 409)
  }
  logPaymentEvent('error', 'payment_persistence_failed', { code: error.code })
  return unavailableResponse()
}

export async function POST(request: NextRequest) {
  let repository: PaymentRepository | undefined
  let attemptId: string | undefined

  try {
    assertSameOrigin(request)
    const input = paymentRequestSchema.parse(await readJsonBody(request))
    const session = readGuestSession(request, false)
    if (!session) return apiJson({ error: 'Sessão de checkout expirada.' }, 401)

    const config = readMercadoPagoConfig(process.env, 'payment')
    repository = new PaymentRepository(createSupabaseAdmin(config))
    const allowed = await repository.consumeRateLimit(rateLimitKey(request, session.hash, 'payment'), 5, 60)
    if (!allowed) return apiJson({ error: 'Muitas tentativas. Aguarde um minuto.' }, 429)

    const attempt = await repository.startAttempt({
      publicOrderId: input.publicOrderId,
      sessionHash: session.hash,
      clientAttemptId: input.attemptId,
      requestFingerprint: createPaymentFingerprint(input),
      paymentMethodId: input.payment.paymentMethodId,
      paymentTypeId: input.payment.paymentTypeId,
      installments: input.payment.installments,
    })
    attemptId = attempt.payment_attempt_id

    if (attempt.provider_order_id) {
      const authoritative = await getMercadoPagoOrder(attempt.provider_order_id, config.accessToken)
      const status = mapMercadoPagoStatus(authoritative.status, authoritative.statusDetail)
      const applied = await repository.applyProviderOrder(authoritative, status)
      return apiJson(
        { publicOrderId: applied.public_order_id, status: applied.status },
        paymentStatusCode(applied.status),
      )
    }

    const claimed = await repository.claimAttempt(attempt.payment_attempt_id, session.hash)
    if (!claimed) {
      return apiJson({ publicOrderId: input.publicOrderId, status: 'PROCESSING' }, 202)
    }

    const authoritative = await createMercadoPagoOrder({
      accessToken: config.accessToken,
      idempotencyKey: attempt.idempotency_key,
      externalReference: attempt.external_reference,
      totalCents: attempt.total_cents,
      payment: {
        ...input.payment,
        payer: { ...input.payment.payer, email: attempt.payer_email },
      },
    })
    const status = mapMercadoPagoStatus(authoritative.status, authoritative.statusDetail)
    const applied = await repository.applyProviderOrder(authoritative, status)
    logPaymentEvent('info', 'order_reconciled', {
      publicOrderId: applied.public_order_id,
      status: applied.status,
      transitionedToPaid: applied.transitioned_to_paid,
    })
    return apiJson(
      { publicOrderId: applied.public_order_id, status: applied.status },
      paymentStatusCode(applied.status),
    )
  } catch (error) {
    if (error instanceof InvalidRequestError) {
      if (error.code === 'origin') return apiJson({ error: 'Origem da requisição não autorizada.' }, 403)
      return apiJson({ error: 'Requisição inválida.' }, error.code === 'body_too_large' ? 413 : 400)
    }
    if (error instanceof z.ZodError) return apiJson({ error: 'Dados de pagamento inválidos.' }, 400)
    if (error instanceof PaymentPersistenceError) return persistenceFailure(error)
    if (error instanceof MercadoPagoApiError && repository && attemptId) {
      const code = error.providerCode ?? `http_${error.status}`
      try {
        if (error.retryable) await repository.markRetryable(attemptId, code)
        else await repository.failAttempt(attemptId, code)
      } catch {
        logPaymentEvent('error', 'attempt_state_update_failed')
      }
      logPaymentEvent(error.retryable ? 'warn' : 'info', 'provider_request_failed', {
        providerStatus: error.status,
        retryable: error.retryable,
      })
      return error.retryable
        ? unavailableResponse()
        : apiJson({ error: 'Pagamento não autorizado. Revise os dados e tente novamente.' }, 422)
    }
    logPaymentEvent('error', 'payment_route_failed')
    return unavailableResponse()
  }
}
