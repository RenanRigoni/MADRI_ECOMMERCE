import { describe, expect, it } from 'vitest'
import { createPaymentFingerprint } from './fingerprint'
import type { PaymentRequest } from './schema'

const request = {
  publicOrderId: '00000000-0000-4000-8000-000000000001',
  attemptId: '00000000-0000-4000-8000-000000000002',
  payment: {
    token: 'secret-token-one',
    paymentMethodId: 'master',
    paymentTypeId: 'credit_card',
    installments: 2,
    payer: { identification: { type: 'CPF', number: '12345678909' } },
  },
} satisfies PaymentRequest

describe('createPaymentFingerprint', () => {
  it('is stable and intentionally excludes the one-time token and document number', () => {
    const first = createPaymentFingerprint(request)
    const second = createPaymentFingerprint({
      ...request,
      payment: {
        ...request.payment,
        token: 'secret-token-two',
        payer: { identification: { type: 'CPF', number: '98765432100' } },
      },
    })
    expect(first).toMatch(/^[a-f0-9]{64}$/)
    expect(second).toBe(first)
  })

  it('changes for material attempt parameters', () => {
    expect(createPaymentFingerprint({
      ...request,
      payment: { ...request.payment, installments: 3 },
    })).not.toBe(createPaymentFingerprint(request))
  })

  it('is stable for pix payments, which have no token or installments', () => {
    const pixRequest = {
      publicOrderId: '00000000-0000-4000-8000-000000000001',
      attemptId: '00000000-0000-4000-8000-000000000002',
      payment: {
        paymentTypeId: 'bank_transfer',
        paymentMethodId: 'pix',
        payer: { identification: { type: 'CPF', number: '12345678909' } },
      },
    } satisfies PaymentRequest
    expect(createPaymentFingerprint(pixRequest)).toMatch(/^[a-f0-9]{64}$/)
  })
})
