import { describe, expect, it, vi } from 'vitest'
import {
  MercadoPagoApiError,
  createMercadoPagoOrder,
  getMercadoPagoChargeback,
  getMercadoPagoOrder,
} from './orders-client'

const providerResponse = {
  id: 'ORD01ABC',
  type: 'online',
  processing_mode: 'automatic',
  external_reference: 'ord_local_abc',
  total_amount: '129.90',
  status: 'processed',
  status_detail: 'accredited',
  transactions: {
    payments: [
      {
        id: 'PAY01ABC',
        amount: '129.90',
        status: 'processed',
        status_detail: 'accredited',
        payment_method: {
          id: 'master',
          type: 'credit_card',
          token: 'must-not-leave-the-adapter',
          installments: 1,
        },
      },
    ],
  },
}

describe('Mercado Pago Orders client', () => {
  it('creates one online automatic Order using the authoritative amount and stable key', async () => {
    const fetchImplementation = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify(providerResponse), {
        status: 201,
        headers: { 'content-type': 'application/json', 'x-request-id': 'provider-request' },
      }),
    )

    const snapshot = await createMercadoPagoOrder(
      {
        accessToken: 'server-access-token',
        idempotencyKey: '8e552b56-2a85-4fac-b438-15680bfd0ff4',
        externalReference: 'ord_local_abc',
        totalCents: 12_990,
        payment: {
          token: 'single-use-token',
          paymentMethodId: 'master',
          paymentTypeId: 'credit_card',
          installments: 1,
          payer: {
            email: 'buyer@example.com',
            identification: { type: 'CPF', number: '12345678909' },
          },
        },
      },
      fetchImplementation,
    )

    expect(fetchImplementation).toHaveBeenCalledTimes(1)
    const [url, init] = fetchImplementation.mock.calls[0]
    expect(url).toBe('https://api.mercadopago.com/v1/orders')
    expect(new Headers(init?.headers).get('authorization')).toBe('Bearer server-access-token')
    expect(new Headers(init?.headers).get('x-idempotency-key')).toBe(
      '8e552b56-2a85-4fac-b438-15680bfd0ff4',
    )
    expect(JSON.parse(String(init?.body))).toMatchObject({
      type: 'online',
      processing_mode: 'automatic',
      total_amount: '129.90',
      external_reference: 'ord_local_abc',
      transactions: { payments: [{ amount: '129.90' }] },
    })
    expect(snapshot).not.toHaveProperty('token')
    expect(JSON.stringify(snapshot)).not.toContain('must-not-leave-the-adapter')
  })

  it('retrieves the authoritative Order from the provider', async () => {
    const fetchImplementation = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify(providerResponse), { status: 200 }),
    )

    await getMercadoPagoOrder('ORD01ABC', 'server-access-token', fetchImplementation)

    expect(fetchImplementation).toHaveBeenCalledWith(
      'https://api.mercadopago.com/v1/orders/ORD01ABC',
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('turns provider failures into sanitized typed errors', async () => {
    const fetchImplementation = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ message: 'do not expose provider response' }), { status: 400 }),
    )

    await expect(
      createMercadoPagoOrder(
        {
          accessToken: 'secret',
          idempotencyKey: '8e552b56-2a85-4fac-b438-15680bfd0ff4',
          externalReference: 'ord_local_abc',
          totalCents: 12_990,
          payment: {
            token: 'secret-token',
            paymentMethodId: 'master',
            paymentTypeId: 'credit_card',
            installments: 1,
            payer: {
              email: 'buyer@example.com',
              identification: { type: 'CPF', number: '12345678909' },
            },
          },
        },
        fetchImplementation,
      ),
    ).rejects.toEqual(expect.objectContaining<Partial<MercadoPagoApiError>>({ status: 400 }))
  })

  it('treats network failures as retryable without leaking the underlying error', async () => {
    const fetchImplementation = vi.fn<typeof fetch>().mockRejectedValue(new Error('socket with secret details'))
    await expect(getMercadoPagoOrder('ORD01ABC', 'secret', fetchImplementation)).rejects.toMatchObject({
      name: 'MercadoPagoApiError', status: 503, retryable: true, providerCode: 'network_error',
      message: 'Mercado Pago request failed',
    })
  })

  it.each([401, 403])('keeps provider credential failure %s retryable and sanitized', async (status) => {
    const fetchImplementation = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ code: 'invalid_token', message: 'sensitive provider detail' }), { status }),
    )

    await expect(getMercadoPagoOrder('ORD01ABC', 'invalid-token', fetchImplementation)).rejects.toMatchObject({
      name: 'MercadoPagoApiError', status, retryable: true, message: 'Mercado Pago request failed',
    })
  })

  it('retrieves and sanitizes an authoritative chargeback resource', async () => {
    const fetchImplementation = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({
        id: '217000087654321000',
        payments: [77908123456],
        currency: 'BRL',
        amount: 108.43,
        documentation_status: 'not_supplied',
        documentation: [{ url: 'must-not-be-persisted' }],
      }), { status: 200 }),
    )

    await expect(getMercadoPagoChargeback('217000087654321000', 'secret', fetchImplementation)).resolves.toEqual({
      id: '217000087654321000',
      paymentIds: ['77908123456'],
      amountCents: 10_843,
      currency: 'BRL',
      statusDetail: 'not_supplied',
    })
    expect(fetchImplementation).toHaveBeenCalledWith(
      'https://api.mercadopago.com/v1/chargebacks/217000087654321000',
      expect.objectContaining({ method: 'GET' }),
    )
  })
})
