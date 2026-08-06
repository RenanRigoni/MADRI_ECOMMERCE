import { z } from 'zod'
import type { NextRequest } from 'next/server'
import { getMercadoPagoChargeback, getMercadoPagoOrder } from '@/lib/mercadopago/orders-client'
import { validateMercadoPagoWebhookSignature } from '@/lib/mercadopago/webhook-signature'
import { readMercadoPagoConfig } from '@/lib/payments/env'
import { PaymentRepository } from '@/lib/payments/repository'
import { logPaymentEvent } from '@/lib/payments/safe-log'
import { mapMercadoPagoStatus } from '@/lib/payments/status'
import { apiJson, unavailableResponse } from '@/lib/server/api-response'
import { InvalidRequestError, readJsonBody } from '@/lib/server/http'
import { createSupabaseAdmin } from '@/lib/server/supabase-admin'

export const runtime = 'nodejs'

const notificationSchema = z.object({
  type: z.enum(['order', 'topic_chargebacks_wh']),
  data: z.object({ id: z.union([z.string(), z.number().safe()]).transform(String) }).optional(),
  id: z.union([z.string(), z.number().safe()]).transform(String).optional(),
}).passthrough().refine((notification) => notification.data?.id || notification.id)

export async function POST(request: NextRequest) {
  const dataId = request.nextUrl.searchParams.get('data.id')
  const requestId = request.headers.get('x-request-id')
  const xSignature = request.headers.get('x-signature')

  logPaymentEvent('warn', 'webhook_debug_diagnostic', {
    dataId,
    requestId,
    xSignaturePresent: Boolean(xSignature),
    xSignatureShape: xSignature,
    search: request.nextUrl.search,
  })

  try {
    const config = readMercadoPagoConfig(process.env, 'webhook')
    validateMercadoPagoWebhookSignature({
      xSignature,
      xRequestId: requestId,
      dataId,
      secret: config.webhookSecret ?? '',
    })
    if (!dataId || !requestId) return apiJson({ error: 'Notificação inválida.' }, 400)

    const notification = notificationSchema.parse(await readJsonBody(request, 32_768))
    const notificationId = notification.data?.id ?? notification.id
    if (!notificationId || notificationId.toLowerCase() !== dataId.toLowerCase()) {
      return apiJson({ error: 'Notificação inválida.' }, 400)
    }

    const repository = new PaymentRepository(createSupabaseAdmin(config))
    if (notification.type === 'topic_chargebacks_wh') {
      const chargeback = await getMercadoPagoChargeback(dataId, config.accessToken)
      if (chargeback.id.toLowerCase() !== dataId.toLowerCase()) {
        throw new Error('Authoritative provider chargeback id mismatch')
      }
      const applied = await repository.applyProviderChargeback(chargeback)
      const firstDelivery = await repository.recordWebhook({
        requestId,
        providerOrderId: `chargeback:${chargeback.id}`,
        providerStatus: 'chargeback',
        providerStatusDetail: chargeback.statusDetail,
      })
      logPaymentEvent('warn', 'chargeback_reconciled', {
        publicOrderId: applied.public_order_id,
        status: applied.status,
        firstDelivery,
      })
      return apiJson({ received: true })
    }

    const authoritative = await getMercadoPagoOrder(dataId, config.accessToken)
    if (authoritative.id.toLowerCase() !== dataId.toLowerCase()) {
      throw new Error('Authoritative provider order id mismatch')
    }
    const status = mapMercadoPagoStatus(authoritative.status, authoritative.statusDetail)
    const applied = await repository.applyProviderOrder(authoritative, status)
    const firstDelivery = await repository.recordWebhook({
      requestId,
      providerOrderId: authoritative.id,
      providerStatus: authoritative.status,
      providerStatusDetail: authoritative.statusDetail,
    })
    logPaymentEvent('info', 'webhook_reconciled', {
      publicOrderId: applied.public_order_id,
      status: applied.status,
      firstDelivery,
      transitionedToPaid: applied.transitioned_to_paid,
    })
    return apiJson({ received: true })
  } catch (error) {
    if (error instanceof InvalidRequestError) {
      return apiJson({ error: 'Notificação inválida.' }, error.code === 'body_too_large' ? 413 : 400)
    }
    if (error instanceof z.ZodError) return apiJson({ error: 'Notificação inválida.' }, 400)
    if (error instanceof Error && (
      error.name === 'WebhookSignatureError' ||
      error.name === 'WebhookTimestampError' ||
      error.message.toLowerCase().includes('signature')
    )) {
      logPaymentEvent('warn', 'webhook_signature_rejected')
      return apiJson({ error: 'Assinatura inválida.' }, 401)
    }
    logPaymentEvent('error', 'webhook_reconciliation_failed')
    return unavailableResponse()
  }
}
