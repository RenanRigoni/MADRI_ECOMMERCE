import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { validateMercadoPagoWebhookSignature } from './webhook-signature'

function signature(secret: string, dataId: string, requestId: string, timestamp: string) {
  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${timestamp};`
  return `ts=${timestamp},v1=${createHmac('sha256', secret).update(manifest).digest('hex')}`
}

describe('Mercado Pago webhook signature', () => {
  it('validates an official HMAC manifest and lowercases the Order id', () => {
    const now = 1_752_000_000_000
    const timestamp = String(now)
    expect(() =>
      validateMercadoPagoWebhookSignature({
        xSignature: signature('webhook-secret', 'ORD01ABC', 'request-id', timestamp),
        xRequestId: 'request-id',
        dataId: 'ORD01ABC',
        secret: 'webhook-secret',
        now: () => now,
      }),
    ).not.toThrow()
  })

  it('rejects invalid and stale signatures', () => {
    const now = 1_752_000_000_000
    expect(() =>
      validateMercadoPagoWebhookSignature({
        xSignature: 'ts=1752000000000,v1=invalid',
        xRequestId: 'request-id',
        dataId: 'ORD01ABC',
        secret: 'webhook-secret',
        now: () => now,
      }),
    ).toThrow()

    const stale = String(now - 301_000)
    expect(() =>
      validateMercadoPagoWebhookSignature({
        xSignature: signature('webhook-secret', 'ORD01ABC', 'request-id', stale),
        xRequestId: 'request-id',
        dataId: 'ORD01ABC',
        secret: 'webhook-secret',
        now: () => now,
      }),
    ).toThrow()
  })

  it('rejects ambiguous timestamps instead of checking a different timestamp than the SDK', () => {
    const now = 1_752_000_000_000
    const stale = String(now - 301_000)
    const staleSignature = signature('webhook-secret', 'ORD01ABC', 'request-id', stale)
    expect(() => validateMercadoPagoWebhookSignature({
      xSignature: `ts=${now},${staleSignature}`,
      xRequestId: 'request-id',
      dataId: 'ORD01ABC',
      secret: 'webhook-secret',
      now: () => now,
    })).toThrow()
  })
})
