import type { MercadoPagoOrderSnapshot } from './orders-client'

export interface LocalPaymentAttemptIdentity {
  providerOrderId: string
  externalReference: string
  totalCents: number
}

export class MercadoPagoOrderMismatchError extends Error {
  constructor() {
    super('Authoritative Mercado Pago order does not match the local payment attempt')
    this.name = 'MercadoPagoOrderMismatchError'
  }
}

export function assertOrderMatchesLocalAttempt(
  order: MercadoPagoOrderSnapshot,
  localAttempt: LocalPaymentAttemptIdentity,
): void {
  const orderAmountMatches = order.totalAmountCents === localAttempt.totalCents
  const paymentAmountMatches =
    order.paymentAmountCents === null || order.paymentAmountCents === localAttempt.totalCents
  const currencyMatches = order.currency === undefined || order.currency === 'BRL'

  if (
    order.id !== localAttempt.providerOrderId ||
    order.externalReference !== localAttempt.externalReference ||
    !orderAmountMatches ||
    !paymentAmountMatches ||
    !currencyMatches
  ) {
    throw new MercadoPagoOrderMismatchError()
  }
}
