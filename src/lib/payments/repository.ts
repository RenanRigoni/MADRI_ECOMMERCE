import 'server-only'

import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { QuoteRequest } from './schema'
import type { LocalPaymentStatus } from './status'
import type { MercadoPagoChargebackSnapshot, MercadoPagoOrderSnapshot } from '@/lib/mercadopago/orders-client'

const centsSchema = z.coerce.number().int().nonnegative().safe()
const itemSchema = z.object({
  productId: z.string(),
  name: z.string(),
  quantity: z.number().int().positive(),
  unitPriceCents: centsSchema,
  lineTotalCents: centsSchema,
})

const quoteSchema = z.object({
  public_order_id: z.uuid(),
  external_reference: z.string(),
  items: z.array(itemSchema),
  subtotal_cents: centsSchema,
  shipping_cents: centsSchema,
  total_cents: centsSchema,
  currency: z.literal('BRL'),
  expires_at: z.string(),
})

const attemptSchema = z.object({
  payment_attempt_id: z.uuid(),
  idempotency_key: z.uuid(),
  external_reference: z.string(),
  total_cents: centsSchema,
  currency: z.literal('BRL'),
  payer_email: z.email(),
  provider_order_id: z.string().nullable(),
  status: z.string(),
  request_state: z.string(),
  is_new: z.boolean(),
})

const applySchema = z.object({
  public_order_id: z.uuid(),
  status: z.string(),
  fulfillment_status: z.string(),
  transitioned_to_paid: z.boolean(),
})

const publicOrderSchema = z.object({
  public_order_id: z.uuid(),
  status: z.string(),
  fulfillment_status: z.string(),
  total_cents: centsSchema,
  currency: z.literal('BRL'),
  provider_order_id: z.string().nullable(),
  created_at: z.string(),
  items: z.array(itemSchema),
})

const PERSISTENCE_CODES = [
  'invalid_session', 'invalid_cart', 'invalid_customer', 'invalid_quantity',
  'unknown_product', 'product_not_priced', 'out_of_stock', 'duplicate_product',
  'order_not_found', 'attempt_conflict', 'quote_expired', 'order_not_payable',
  'payment_in_progress', 'invalid_fingerprint', 'invalid_payment_type',
  'invalid_installments', 'quote_changed', 'currency_mismatch', 'amount_mismatch',
  'payment_amount_mismatch', 'provider_order_mismatch', 'attempt_not_found',
  'inventory_invariant_failed', 'invalid_shipping', 'provider_payment_mismatch',
  'chargeback_not_found', 'ambiguous_chargeback', 'chargeback_amount_mismatch',
  'invalid_paid_transition',
] as const

export type PaymentPersistenceCode = (typeof PERSISTENCE_CODES)[number] | 'persistence_failure'

export class PaymentPersistenceError extends Error {
  constructor(readonly code: PaymentPersistenceCode) {
    super('Payment persistence operation failed')
    this.name = 'PaymentPersistenceError'
  }
}

function persistenceError(error: { message?: string } | null): PaymentPersistenceError {
  const message = error?.message ?? ''
  const code = PERSISTENCE_CODES.find((candidate) => message.includes(candidate))
  return new PaymentPersistenceError(code ?? 'persistence_failure')
}

function one<T>(schema: z.ZodType<T>, data: unknown, error: { message?: string } | null): T {
  if (error) throw persistenceError(error)
  const row = Array.isArray(data) ? data[0] : data
  const parsed = schema.safeParse(row)
  if (!parsed.success) throw new PaymentPersistenceError('persistence_failure')
  return parsed.data
}

export interface CheckoutQuote {
  publicOrderId: string
  items: z.infer<typeof itemSchema>[]
  subtotalCents: number
  shippingCents: number
  totalCents: number
  currency: 'BRL'
  expiresAt: string
}

export class PaymentRepository {
  constructor(private readonly client: SupabaseClient) {}

  async consumeRateLimit(keyHash: string, limit: number, windowSeconds: number): Promise<boolean> {
    const { data, error } = await this.client.rpc('consume_api_rate_limit', {
      p_key_hash: keyHash, p_limit: limit, p_window_seconds: windowSeconds,
    })
    if (error || typeof data !== 'boolean') throw persistenceError(error)
    return data
  }

  async createQuote(sessionHash: string, request: QuoteRequest, shippingCents: number): Promise<CheckoutQuote> {
    const { data, error } = await this.client.rpc('create_checkout_quote', {
      p_guest_session_hash: sessionHash,
      p_items: request.items,
      p_customer: request.customer,
      p_shipping_cents: shippingCents,
    })
    const row = one(quoteSchema, data, error)
    return {
      publicOrderId: row.public_order_id,
      items: row.items,
      subtotalCents: row.subtotal_cents,
      shippingCents: row.shipping_cents,
      totalCents: row.total_cents,
      currency: row.currency,
      expiresAt: row.expires_at,
    }
  }

  async startAttempt(input: {
    publicOrderId: string
    sessionHash: string
    clientAttemptId: string
    requestFingerprint: string
    paymentMethodId: string
    paymentTypeId: string
    installments: number
  }) {
    const { data, error } = await this.client.rpc('start_payment_attempt', {
      p_public_order_id: input.publicOrderId,
      p_guest_session_hash: input.sessionHash,
      p_client_attempt_id: input.clientAttemptId,
      p_request_fingerprint: input.requestFingerprint,
      p_payment_method_id: input.paymentMethodId,
      p_payment_type_id: input.paymentTypeId,
      p_installments: input.installments,
    })
    return one(attemptSchema, data, error)
  }

  async claimAttempt(attemptId: string, sessionHash: string): Promise<boolean> {
    const { data, error } = await this.client.rpc('claim_payment_attempt', {
      p_payment_attempt_id: attemptId, p_guest_session_hash: sessionHash,
    })
    if (error || typeof data !== 'boolean') throw persistenceError(error)
    return data
  }

  async markRetryable(attemptId: string, providerErrorCode: string): Promise<void> {
    const { error } = await this.client.rpc('mark_payment_attempt_retryable', {
      p_payment_attempt_id: attemptId, p_provider_error_code: providerErrorCode,
    })
    if (error) throw persistenceError(error)
  }

  async failAttempt(attemptId: string, providerErrorCode: string): Promise<void> {
    const { error } = await this.client.rpc('fail_payment_attempt', {
      p_payment_attempt_id: attemptId, p_provider_error_code: providerErrorCode,
    })
    if (error) throw persistenceError(error)
  }

  async applyProviderOrder(order: MercadoPagoOrderSnapshot, status: LocalPaymentStatus) {
    const { data, error } = await this.client.rpc('apply_mercado_pago_order', {
      p_provider_order_id: order.id,
      p_provider_payment_id: order.paymentId,
      p_external_reference: order.externalReference,
      p_total_cents: order.totalAmountCents,
      p_payment_amount_cents: order.paymentAmountCents,
      p_currency: order.currency ?? 'BRL',
      p_local_status: status,
      p_provider_status: order.status,
      p_provider_status_detail: order.statusDetail,
    })
    return one(applySchema, data, error)
  }

  async applyProviderChargeback(chargeback: MercadoPagoChargebackSnapshot) {
    const { data, error } = await this.client.rpc('apply_mercado_pago_chargeback', {
      p_chargeback_id: chargeback.id,
      p_provider_payment_ids: chargeback.paymentIds,
      p_amount_cents: chargeback.amountCents,
      p_currency: chargeback.currency,
      p_provider_status_detail: chargeback.statusDetail,
    })
    return one(applySchema, data, error)
  }

  async recordWebhook(input: {
    requestId: string
    providerOrderId: string
    providerStatus: string | null
    providerStatusDetail: string | null
  }): Promise<boolean> {
    const { data, error } = await this.client.rpc('record_mercado_pago_webhook', {
      p_request_id: input.requestId,
      p_provider_order_id: input.providerOrderId,
      p_provider_status: input.providerStatus,
      p_provider_status_detail: input.providerStatusDetail,
    })
    if (error || typeof data !== 'boolean') throw persistenceError(error)
    return data
  }

  async getPublicOrder(publicOrderId: string, sessionHash: string) {
    const { data, error } = await this.client.rpc('get_public_order_status', {
      p_public_order_id: publicOrderId, p_guest_session_hash: sessionHash,
    })
    if (error) throw persistenceError(error)
    if (!Array.isArray(data) || data.length === 0) return null
    return one(publicOrderSchema, data, null)
  }
}
