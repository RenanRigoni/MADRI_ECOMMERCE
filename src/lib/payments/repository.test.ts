import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { PaymentPersistenceError, PaymentRepository } from './repository'

const rpc = vi.fn()
const repository = new PaymentRepository({ rpc } as unknown as SupabaseClient)
const quoteRequest = {
  items: [{ productId: 'product-1', quantity: 1 }],
  customer: {
    name: 'Cliente Teste', email: 'test@example.com', phone: '11999999999',
    address: { postalCode: '01001000', street: 'Rua A', number: '1', complement: '', neighborhood: 'Centro', city: 'São Paulo', state: 'SP' },
  },
}
const item = { productId: 'product-1', name: 'Produto', quantity: 1, unitPriceCents: 12990, lineTotalCents: 12990 }

beforeEach(() => rpc.mockReset())

describe('PaymentRepository', () => {
  it('creates and sanitizes an authoritative quote', async () => {
    rpc.mockResolvedValue({ data: [{
      public_order_id: '00000000-0000-4000-8000-000000000001',
      external_reference: 'order-ref', items: [item], subtotal_cents: 12990,
      shipping_cents: 0, total_cents: 12990, currency: 'BRL', expires_at: '2026-08-05T12:00:00Z',
    }], error: null })
    await expect(repository.createQuote('a'.repeat(64), quoteRequest, 0)).resolves.toMatchObject({
      publicOrderId: '00000000-0000-4000-8000-000000000001', totalCents: 12990,
    })
    expect(rpc).toHaveBeenCalledWith('create_checkout_quote', expect.objectContaining({ p_items: quoteRequest.items }))
  })

  it('starts and claims a stable payment attempt', async () => {
    rpc.mockResolvedValueOnce({ data: [{
      payment_attempt_id: '00000000-0000-4000-8000-000000000002',
      idempotency_key: '00000000-0000-4000-8000-000000000003',
      external_reference: 'order-ref', total_cents: 12990, currency: 'BRL',
      payer_email: 'test@example.com',
      provider_order_id: null, status: 'PENDING', request_state: 'PENDING', is_new: true,
    }], error: null }).mockResolvedValueOnce({ data: true, error: null })

    const attempt = await repository.startAttempt({
      publicOrderId: '00000000-0000-4000-8000-000000000001', sessionHash: 'a'.repeat(64),
      clientAttemptId: '00000000-0000-4000-8000-000000000002', requestFingerprint: 'b'.repeat(64),
      paymentMethodId: 'master', paymentTypeId: 'credit_card', installments: 1,
    })
    expect(attempt.is_new).toBe(true)
    await expect(repository.claimAttempt(attempt.payment_attempt_id, 'a'.repeat(64))).resolves.toBe(true)
  })

  it('updates retryable and terminal provider failures', async () => {
    rpc.mockResolvedValue({ data: null, error: null })
    await repository.markRetryable('00000000-0000-4000-8000-000000000002', 'timeout')
    await repository.failAttempt('00000000-0000-4000-8000-000000000002', 'invalid_request')
    expect(rpc).toHaveBeenNthCalledWith(1, 'mark_payment_attempt_retryable', expect.any(Object))
    expect(rpc).toHaveBeenNthCalledWith(2, 'fail_payment_attempt', expect.any(Object))
  })

  it('applies an authoritative provider snapshot', async () => {
    rpc.mockResolvedValue({ data: [{
      public_order_id: '00000000-0000-4000-8000-000000000001', status: 'PAID',
      fulfillment_status: 'READY', transitioned_to_paid: true,
    }], error: null })
    await expect(repository.applyProviderOrder({
      id: 'provider-order', externalReference: 'order-ref', totalAmountCents: 12990,
      paymentAmountCents: 12990, status: 'processed', statusDetail: 'accredited',
      paymentId: 'payment-id', paymentMethodId: 'master', paymentTypeId: 'credit_card', installments: 1,
    }, 'PAID')).resolves.toMatchObject({ status: 'PAID', transitioned_to_paid: true })
  })

  it('applies an authoritative chargeback without persisting provider documents', async () => {
    rpc.mockResolvedValue({ data: [{
      public_order_id: '00000000-0000-4000-8000-000000000001', status: 'CHARGEBACK',
      fulfillment_status: 'REVIEW_REQUIRED', transitioned_to_paid: false,
    }], error: null })
    await expect(repository.applyProviderChargeback({
      id: 'chargeback-id', paymentIds: ['payment-id'], amountCents: 12990,
      currency: 'BRL', statusDetail: 'not_supplied',
    })).resolves.toMatchObject({ status: 'CHARGEBACK', fulfillment_status: 'REVIEW_REQUIRED' })
    expect(rpc).toHaveBeenCalledWith('apply_mercado_pago_chargeback', {
      p_chargeback_id: 'chargeback-id',
      p_provider_payment_ids: ['payment-id'],
      p_amount_cents: 12990,
      p_currency: 'BRL',
      p_provider_status_detail: 'not_supplied',
    })
  })

  it('records webhook deliveries and reads order status', async () => {
    rpc.mockResolvedValueOnce({ data: true, error: null }).mockResolvedValueOnce({ data: [{
      public_order_id: '00000000-0000-4000-8000-000000000001', status: 'PAID',
      fulfillment_status: 'READY', total_cents: '12990', currency: 'BRL', provider_order_id: 'provider-order',
      created_at: '2026-08-05T12:00:00Z', items: [item],
    }], error: null }).mockResolvedValueOnce({ data: [], error: null })
    await expect(repository.recordWebhook({ requestId: 'request', providerOrderId: 'provider-order', providerStatus: 'processed', providerStatusDetail: 'accredited' })).resolves.toBe(true)
    await expect(repository.getPublicOrder('00000000-0000-4000-8000-000000000001', 'a'.repeat(64))).resolves.toMatchObject({ total_cents: 12990 })
    await expect(repository.getPublicOrder('00000000-0000-4000-8000-000000000001', 'a'.repeat(64))).resolves.toBeNull()
  })

  it('consumes durable rate limits', async () => {
    rpc.mockResolvedValue({ data: true, error: null })
    await expect(repository.consumeRateLimit('a'.repeat(64), 5, 60)).resolves.toBe(true)
  })

  it('maps known database failures without exposing database text', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'P0001: out_of_stock internal detail' } })
    await expect(repository.createQuote('a'.repeat(64), quoteRequest, 0)).rejects.toMatchObject({
      name: 'PaymentPersistenceError', code: 'out_of_stock', message: 'Payment persistence operation failed',
    })
  })

  it('fails closed for malformed RPC output and unexpected boolean output', async () => {
    rpc.mockResolvedValueOnce({ data: [{ malformed: true }], error: null })
      .mockResolvedValueOnce({ data: 'yes', error: null })
    await expect(repository.createQuote('a'.repeat(64), quoteRequest, 0)).rejects.toBeInstanceOf(PaymentPersistenceError)
    await expect(repository.consumeRateLimit('a'.repeat(64), 5, 60)).rejects.toBeInstanceOf(PaymentPersistenceError)
  })
})
