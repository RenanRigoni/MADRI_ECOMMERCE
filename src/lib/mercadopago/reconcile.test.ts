import { describe, expect, it } from 'vitest'
import { assertOrderMatchesLocalAttempt, MercadoPagoOrderMismatchError } from './reconcile'

const order = {
  id: 'ORD01ABC',
  externalReference: 'ord_local_abc',
  totalAmountCents: 12_990,
  paymentAmountCents: 12_990,
  status: 'processed',
  statusDetail: 'accredited',
  paymentId: 'PAY01ABC',
  paymentMethodId: 'master',
  paymentTypeId: 'credit_card',
  installments: 1,
}

describe('authoritative Order reconciliation', () => {
  it('accepts a matching provider order', () => {
    expect(() =>
      assertOrderMatchesLocalAttempt(order, {
        providerOrderId: 'ORD01ABC',
        externalReference: 'ord_local_abc',
        totalCents: 12_990,
      }),
    ).not.toThrow()
  })

  it.each([
    ['providerOrderId', 'ORD_DIFFERENT'],
    ['externalReference', 'ord_different'],
    ['totalCents', 1],
  ])('rejects a mismatched %s', (field, value) => {
    expect(() =>
      assertOrderMatchesLocalAttempt(order, {
        providerOrderId: field === 'providerOrderId' ? String(value) : 'ORD01ABC',
        externalReference: field === 'externalReference' ? String(value) : 'ord_local_abc',
        totalCents: field === 'totalCents' ? Number(value) : 12_990,
      }),
    ).toThrow(MercadoPagoOrderMismatchError)
  })
})
